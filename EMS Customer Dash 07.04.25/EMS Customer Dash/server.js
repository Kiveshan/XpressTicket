require("dotenv").config()
console.log("JWT_SECRET from .env:", process.env.JWT_SECRET ? "Set" : "Not set")

const express = require("express")
const { Pool } = require("pg")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const multer = require("multer")
const { isUint16Array } = require("util/types")

// Default image data URI for fallback
const DEFAULT_IMAGE_DATA_URI =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBmaWxsPSIjRDFENU5COiIvPgo8cGF0aCBkPSJNMTM3LjUgOTMuNzVMMTUwIDEwNi4yNUwxNjIuNSA5My43NUwxNzUgMTA2LjI1VjEyNUgxMjVWMTA2LjI1TDEzNy41IDkzLjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"

const app = express()
const port = 5000

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"]
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
  }),
)
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  next()
})

// Validate required environment variables
const requiredEnvVars = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_BUCKET_NAME", "JWT_SECRET"]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "XPRESS.FINAL",
  password: "1234567890",
  port: 5432,
  timezone: "UTC", // Ensure PostgreSQL uses UTC
})

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:")
    console.error("Error message:", err.message)
    console.error("Error stack:", err.stack)
    console.error("Error details:", JSON.stringify(err, null, 2))
    // Don't exit process to allow debugging
    // process.exit(1);
  } else {
    console.log("✅ Connected to ExpressTicket database")
    initializeLookupTables()
    release()
  }
})

// Ensure faculties/departments tables and seed data
async function initializeLookupTables() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Create faculties table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.faculties (
        faculty_id character varying NOT NULL,
        faculty_name character varying NOT NULL,
        CONSTRAINT faculties_pkey PRIMARY KEY (faculty_id)
      );
    `)

    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.departments (
        department_id character varying NOT NULL,
        department_name character varying NOT NULL,
        faculty_id character varying NOT NULL,
        CONSTRAINT departments_pkey PRIMARY KEY (department_id),
        CONSTRAINT departments_faculty_id_fkey FOREIGN KEY (faculty_id)
          REFERENCES public.faculties (faculty_id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION
          NOT VALID
      );
    `)

    // Create user_profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        user_id SERIAL NOT NULL,
        firstname character varying NOT NULL,
        surname character varying NOT NULL,
        role character varying NOT NULL DEFAULT 'user',
        email character varying NOT NULL,
        cellnumber character varying NOT NULL,
        institution character varying,
        faculty_id character varying,
        department_id character varying,
        ieee_no integer,
        vat_no integer,
        password character varying NOT NULL,
        CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id),
        CONSTRAINT user_profiles_department_id_fkey FOREIGN KEY (department_id)
          REFERENCES public.departments (department_id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION
          NOT VALID,
        CONSTRAINT user_profiles_faculty_id_fkey FOREIGN KEY (faculty_id)
          REFERENCES public.faculties (faculty_id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION
          NOT VALID,
        CONSTRAINT user_profiles_email_unique UNIQUE (email)
      );
    `)

    // Create events table with user_id and status
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.events (
        event_id SERIAL NOT NULL,
        name character varying NOT NULL,
        location character varying NOT NULL,
        startdate timestamptz NOT NULL,
        enddate timestamptz NOT NULL,
        time time without time zone NOT NULL,
        endtime time without time zone,
        duration character varying NOT NULL,
        deadlinetime time without time zone NOT NULL,
        deadlinedate timestamptz NOT NULL,
        type character varying NOT NULL,
        capacity integer NOT NULL,
        attendees character varying[] NOT NULL,
        contactnum character varying NOT NULL,
        email character varying NOT NULL,
        coverimage character varying NOT NULL,
        tabs character varying[] NOT NULL,
        packages character varying[] NOT NULL,
        description character varying,
        terms_and_conditions character varying,
        user_id integer NOT NULL,
        status character varying NOT NULL DEFAULT 'pending',
        admin_comment character varying,
        CONSTRAINT events_pkey PRIMARY KEY (event_id),
        CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id)
          REFERENCES public.user_profiles (user_id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION
          NOT VALID
      );
    `)

    // Create payments table after events
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.payments (
        payment_id SERIAL NOT NULL,
        event_id integer NOT NULL,
        amount real NOT NULL,
        payment_type character varying NOT NULL DEFAULT 'Unknown',
        proof_of_payment character varying,
        CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
        CONSTRAINT payments_event_id_fkey FOREIGN KEY (event_id)
          REFERENCES public.events (event_id) ON DELETE CASCADE
      );
    `)

    // Seed sample data if no faculties present
    const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM faculties")
    if (rows[0].count === 0) {
      console.log("🔰 Seeding default faculties & departments")
      const faculties = [
        { id: "ENG", name: "Engineering" },
        { id: "SCI", name: "Sciences" },
        { id: "HUM", name: "Humanities" },
        { id: "BUS", name: "Business" },
        { id: "HSC", name: "Health Sciences" },
        { id: "FAI", name: "Faculty of Artificial Intelligence" },
      ]

      for (const faculty of faculties) {
        await client.query("INSERT INTO faculties (faculty_id, faculty_name) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
          faculty.id,
          faculty.name,
        ])
      }

      const deptSeed = {
        ENG: [
          { id: "CS", name: "Computer Science" },
          { id: "EE", name: "Electrical Engineering" },
          { id: "ME", name: "Mechanical Engineering" },
        ],
        SCI: [
          { id: "BIO", name: "Biology" },
          { id: "CHEM", name: "Chemistry" },
          { id: "PHY", name: "Physics" },
        ],
        HUM: [
          { id: "HIST", name: "History" },
          { id: "PHIL", name: "Philosophy" },
        ],
        BUS: [
          { id: "MKT", name: "Marketing" },
          { id: "ACC", name: "Accounting" },
        ],
        HSC: [
          { id: "NUR", name: "Nursing" },
          { id: "PT", name: "Physiotherapy" },
        ],
        FAI: [{ id: "FIM", name: "Faculty Intelligence Management" }],
      }

      for (const [facultyId, departments] of Object.entries(deptSeed)) {
        for (const dept of departments) {
          await client.query(
            "INSERT INTO departments (department_id, department_name, faculty_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            [dept.id, dept.name, facultyId],
          )
        }
      }
      console.log("✅ Lookup data seeded")
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error initializing lookup tables:", err)
  } finally {
    client.release()
  }
}

// AWS S3 Configuration
const s3Client = new S3Client({
  region: "af-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."))
    }
  },
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  console.log("Headers:", JSON.stringify(req.headers))
  const authHeader = req.headers["authorization"]
  console.log("Auth header:", authHeader)
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    console.log("No token provided in request")
    return res.status(401).json({ error: "No token provided", events: [] })
  }

  console.log("Verifying token:", token.substring(0, 10) + "...")
  console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set")
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification failed:", err.message)
      return res.status(403).json({ error: "Invalid or expired token", events: [] })
    }
    console.log("Token verified, user:", JSON.stringify(user))
    req.user = user
    next()
  })
}

// Admin middleware
const authenticateAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next()
  } else {
    res.status(403).json({ error: "Admin access required" })
  }
}

// Helper function to split full name into first and last name
const splitName = (fullName) => {
  if (!fullName) return { firstName: "", lastName: "" }
  const names = fullName.trim().split(/\s+/)
  const lastName = names.pop() || ""
  const firstName = names.join(" ")
  return { firstName, lastName }
}

// Helper function to log incoming requests
const logRequest = (req) => {
  console.log("\n=== Incoming Request ===")
  console.log("Method:", req.method)
  console.log("URL:", req.originalUrl)
  console.log("Headers:", req.headers)
  console.log("Body:", req.body)
  console.log("Query:", req.query)
  console.log("Params:", req.params)
  console.log("======================\n")
}

// URL cache to store presigned URLs and reduce flickering
const urlCache = new Map()

// Helper function to generate presigned URL with caching
async function generatePresignedUrl(input) {
  if (!input) {
    console.warn("No input provided for presigned URL")
    return null
  }

  let s3Key = input
  // Handle full S3 URLs
  if (input.startsWith("https://")) {
    try {
      const url = new URL(input)
      // Extract the path after the bucket name
      s3Key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname
      // Remove bucket name if included in the path
      if (s3Key.startsWith(`${process.env.S3_BUCKET_NAME}/`)) {
        s3Key = s3Key.slice(process.env.S3_BUCKET_NAME.length + 1)
      }
    } catch (error) {
      console.error(`Error parsing URL ${input}:`, error)
      return null
    }
  }

  // Validate key
  if (!s3Key || s3Key.trim() === "") {
    console.warn("Invalid or empty S3 key after processing")
    return null
  }

  // Check cache
  const cached = urlCache.get(s3Key)
  if (cached && Date.now() - cached.timestamp < 3600 * 1000) {
    console.log(`Returning cached URL for key: ${s3Key}`)
    return cached.url
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
    })
    console.log(`Generating presigned URL for key: ${s3Key}`)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 }) // 24 hours
    console.log(`Generated presigned URL: ${url.substring(0, 50)}...`)
    urlCache.set(s3Key, { url, timestamp: Date.now() })
    return url
  } catch (error) {
    console.error(`Error generating presigned URL for key ${s3Key}:`, error)
    return null
  }
}

// Admin endpoint to get all events
app.get("/api/admin/events", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    console.log("Fetching all events for admin")

    const result = await pool.query(`
      SELECT e.*, 
             u.firstname, u.surname, u.email as user_email, u.cellnumber,
             p.amount, p.payment_type, p.proof_of_payment
      FROM events e
      LEFT JOIN user_profiles u ON e.user_id = u.user_id
      LEFT JOIN payments p ON e.event_id = p.event_id
      ORDER BY e.startdate DESC
    `)

    const events = await Promise.all(
      result.rows.map(async (event) => {
        if (event.startdate) event.start_date = event.startdate
        if (event.enddate) event.end_date = event.enddate
        if (event.deadlinedate) event.deadline = event.deadlinedate
        event.event_name = event.name

        let file_url = null
        if (event.coverimage && event.coverimage.trim() !== "") {
          try {
            console.log(`Processing coverimage for event ${event.event_id}: ${event.coverimage}`)
            const presignedUrl = await generatePresignedUrl(event.coverimage)
            if (presignedUrl) {
              file_url = presignedUrl
              console.log(
                `Successfully generated presigned URL for event ${event.event_id}: ${file_url.substring(0, 50)}...`,
              )
            } else {
              console.warn(`Failed to generate presigned URL for event ${event.event_id}, falling back to default`)
              file_url = "/default-event-image.png"
            }
          } catch (err) {
            console.error(`Error generating presigned URL for event ${event.event_id}:`, err)
            file_url = "/default-event-image.png"
          }
        } else {
          console.log(`No coverimage for event ${event.event_id}`)
          file_url = "/default-event-image.png"
        }

        return {
          ...event,
          file_url,
        }
      }),
    )

    console.log(`Returning ${events.length} events`)
    res.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

// Admin endpoint to get event details by ID
app.get("/api/admin/events/:eventId", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params
    console.log(`Fetching event details for ID: ${eventId}`)

    const result = await pool.query(
      `
      SELECT e.*, 
             u.firstname, u.surname, u.email, u.cellnumber,
             p.amount, p.payment_type, p.proof_of_payment
      FROM events e
      LEFT JOIN user_profiles u ON e.user_id = u.user_id
      LEFT JOIN payments p ON e.event_id = p.event_id
      WHERE e.event_id = $1
    `,
      [eventId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" })
    }

    const event = result.rows[0]

    if (event.startdate) event.start_date = event.startdate
    if (event.enddate) event.end_date = event.enddate
    if (event.deadlinedate) event.deadline = event.deadlinedate
    event.event_name = event.name
    if (event.type) event.event_type = event.type

    let file_url = "/default-event-image.png"
    if (event.coverimage && event.coverimage.trim() !== "") {
      try {
        console.log(`Processing coverimage for event ${event.event_id}: ${event.coverimage}`)
        const presignedUrl = await generatePresignedUrl(event.coverimage)
        if (presignedUrl) {
          file_url = presignedUrl
          console.log(
            `Successfully generated presigned URL for event ${event.event_id}: ${file_url.substring(0, 50)}...`,
          )
        } else {
          console.warn(`Failed to generate presigned URL for event ${event.event_id}, falling back to default`)
        }
      } catch (err) {
        console.error(`Error generating presigned URL for event ${event.event_id}:`, err)
      }
    } else {
      console.log(`No coverimage for event ${event.event_id}`)
    }
    event.file_url = file_url

    if (event.attendees && Array.isArray(event.attendees)) {
      event.client_type = event.attendees
    } else if (typeof event.attendees === "string") {
      try {
        event.client_type = JSON.parse(event.attendees)
      } catch (e) {
        event.client_type = event.attendees.includes(",")
          ? event.attendees.split(",").map((item) => item.trim())
          : [event.attendees]
      }
    } else {
      event.client_type = []
    }

    if (event.tabs && Array.isArray(event.tabs)) {
      console.log("Original tabs:", event.tabs)
      event.tabs = event.tabs.map((tab, index) => {
        if (typeof tab === "string") {
          const content = tab.trim()
          if (!content.includes(":") && !content.includes("=") && !content.includes(" ")) {
            const name = content.charAt(0).toUpperCase() + content.slice(1)
            return { name, content }
          }
          const separators = ["=", ":", "-", "–"]
          for (const separator of separators) {
            if (content.includes(separator)) {
              const parts = content.split(separator)
              const name = parts[0].trim()
              const tabContent = parts.slice(1).join(separator).trim()
              if (name.length > 0 && name.length < 20) {
                return {
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  content: tabContent || content,
                }
              }
            }
          }
          let name = "Tab"
          if (content.toLowerCase().includes("exhibit")) name = "Exhibits"
          else if (content.toLowerCase().includes("schedule")) name = "Schedule"
          else if (content.toLowerCase().includes("speaker")) name = "Speakers"
          else if (content.toLowerCase().includes("program")) name = "Program"
          else if (content.toLowerCase().includes("agenda")) name = "Agenda"
          else if (content.toLowerCase().includes("venue")) name = "Venue"
          else if (content.toLowerCase().includes("contact")) name = "Contact"
          else name = `Tab ${index + 1}`
          return { name, content }
        }
        if (typeof tab === "object" && tab !== null) {
          return {
            name: tab.name || `Tab ${index + 1}`,
            content: tab.content || "",
          }
        }
        return {
          name: `Tab ${index + 1}`,
          content: typeof tab === "string" ? tab : `Tab ${index + 1} Content`,
        }
      })
      console.log("Processed tabs:", event.tabs)
    }

    if (event.packages && Array.isArray(event.packages)) {
      console.log("Original packages:", event.packages)
      event.packages = event.packages.map((pkg, index) => {
        if (typeof pkg === "string") {
          console.log(`Processing package string: ${pkg}`)
          let cleanedStr = pkg
            .replace(/^\{\\"/, '{"')
            .replace(/\\"\}$/, '"}')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
          if (!cleanedStr.startsWith("{")) cleanedStr = "{" + cleanedStr
          if (!cleanedStr.endsWith("}")) cleanedStr = cleanedStr + "}"
          console.log("Cleaned package string:", cleanedStr)
          try {
            const parsed = JSON.parse(cleanedStr)
            console.log("Parsed package:", parsed)
            return {
              selectType: parsed.selectType || "Full Package",
              packageType: parsed.packageType || "Standard",
              location: parsed.location || "",
              duration: parsed.duration || "",
              dateChoices: parsed.dateChoices || "",
              pricing: parsed.pricing || "N/A",
              details: parsed.details || "",
              typeOptions: Array.isArray(parsed.typeOptions) ? parsed.typeOptions : ["Full Package", "Day"],
            }
          } catch (parseError) {
            console.log("JSON parse failed, trying alternative parsing methods")
            const detailsMatch =
              pkg.match(/["']?details["']?\s*[:=]\s*["']?([^,}"']+)/i) || pkg.match(/details\s*[:=]\s*([^,}]+)/i)
            const pricingMatch =
              pkg.match(/["']?pricing["']?\s*[:=]\s*["']?([^,}"']+)/i) || pkg.match(/pricing\s*[:=]\s*([^,}]+)/i)
            const durationMatch =
              pkg.match(/["']?duration["']?\s*[:=]\s*["']?([^,}"']+)/i) || pkg.match(/duration\s*[:=]\s*([^,}]+)/i)
            const locationMatch =
              pkg.match(/["']?location["']?\s*[:=]\s*["']?([^,}"']+)/i) || pkg.match(/location\s*[:=]\s*([^,}]+)/i)
            const packageTypeMatch =
              pkg.match(/["']?packageType["']?\s*[:=]\s*["']?([^,}"']+)/i) ||
              pkg.match(/packageType\s*[:=]\s*([^,}]+)/i) ||
              pkg.match(/package[_\s-]?type\s*[:=]\s*([^,}]+)/i)
            const selectTypeMatch =
              pkg.match(/["']?selectType["']?\s*[:=]\s*["']?([^,}"']+)/i) ||
              pkg.match(/selectType\s*[:=]\s*([^,}]+)/i) ||
              pkg.match(/select[_\s-]?type\s*[:=]\s*([^,}]+)/i)
            const dateChoicesMatch =
              pkg.match(/["']?dateChoices["']?\s*[:=]\s*["']?([^,}"']+)/i) ||
              pkg.match(/dateChoices\s*[:=]\s*([^,}]+)/i) ||
              pkg.match(/date[_\s-]?choices\s*[:=]\s*([^,}]+)/i)
            if (
              detailsMatch ||
              pricingMatch ||
              durationMatch ||
              locationMatch ||
              packageTypeMatch ||
              selectTypeMatch ||
              dateChoicesMatch
            ) {
              console.log("Extracted package fields using regex")
              return {
                selectType: selectTypeMatch ? selectTypeMatch[1].trim().replace(/["']/g, "") : "Full Package",
                packageType: packageTypeMatch ? packageTypeMatch[1].trim().replace(/["']/g, "") : "Standard",
                location: locationMatch ? locationMatch[1].trim().replace(/["']/g, "") : "",
                duration: durationMatch ? durationMatch[1].trim().replace(/["']/g, "") : "",
                dateChoices: dateChoicesMatch ? dateChoicesMatch[1].trim().replace(/["']/g, "") : "",
                pricing: pricingMatch ? pricingMatch[1].trim().replace(/["']/g, "") : "N/A",
                details: detailsMatch ? detailsMatch[1].trim().replace(/["']/g, "") : pkg,
                typeOptions: ["Full Package", "Day"],
              }
            }
            if (pkg.includes(":") || pkg.includes("=")) {
              const lines = pkg.split(/[,;\n]/).filter((line) => line.trim())
              const packageData = {}
              lines.forEach((line) => {
                const separators = [":", "="]
                for (const separator of separators) {
                  if (line.includes(separator)) {
                    const [key, value] = line.split(separator).map((part) => part.trim())
                    if (key && value) {
                      const normalizedKey = key.toLowerCase().replace(/[\s-_]/g, "")
                      if (
                        normalizedKey === "details" ||
                        normalizedKey === "pricing" ||
                        normalizedKey === "duration" ||
                        normalizedKey === "location" ||
                        normalizedKey === "packagetype" ||
                        normalizedKey === "selecttype" ||
                        normalizedKey === "datechoices"
                      ) {
                        packageData[normalizedKey] = value.replace(/["']/g, "")
                      }
                    }
                    break
                  }
                }
              })
              if (Object.keys(packageData).length > 0) {
                console.log("Extracted package from key-value format:", packageData)
                return {
                  selectType: packageData.selecttype || "Full Package",
                  packageType: packageData.packagetype || "Standard",
                  location: packageData.location || "",
                  duration: packageData.duration || "",
                  dateChoices: packageData.datechoices || "",
                  pricing: packageData.pricing || "N/A",
                  details: packageData.details || pkg,
                  typeOptions: ["Full Package", "Day"],
                }
              }
            }
            return {
              selectType: "Full Package",
              packageType: "Standard",
              location: "",
              duration: "",
              dateChoices: "",
              pricing: "N/A",
              details: pkg,
              typeOptions: ["Full Package", "Day"],
            }
          }
        }
        if (typeof pkg === "object" && pkg !== null) {
          return {
            selectType: pkg.selectType || "Full Package",
            packageType: pkg.packageType || "Standard",
            location: pkg.location || "",
            duration: pkg.duration || "",
            dateChoices: pkg.dateChoices || "",
            pricing: pkg.pricing || "N/A",
            details: pkg.details || "",
            typeOptions: Array.isArray(pkg.typeOptions) ? pkg.typeOptions : ["Full Package", "Day"],
          }
        }
        return {
          selectType: "Full Package",
          packageType: "Standard",
          location: "",
          duration: "",
          dateChoices: "",
          pricing: "N/A",
          details: `Package ${index + 1}`,
          typeOptions: ["Full Package", "Day"],
        }
      })
      console.log("Processed packages:", event.packages)
    }

    res.json(event)
  } catch (error) {
    console.error("Error fetching event details:", error)
    res.status(500).json({ error: "Failed to fetch event details" })
  }
})

// Endpoint to fetch available (approved) events for public display
app.get("/api/events/available", async (req, res) => {
  try {
    console.log("Fetching available events")
    const result = await pool.query(`
      SELECT 
        event_id as id, 
        name, 
        location, 
        startdate::text as date, 
        time::text as time, 
        coverimage,
        description,
        capacity,
        type as event_type
      FROM events 
      WHERE status = 'Approved'
      ORDER BY startdate ASC
    `)
    const events = await Promise.all(
      result.rows.map(async (event) => {
        let file_url = "/default-event-image.png"
        if (event.coverimage && event.coverimage.trim() !== "") {
          try {
            const coverKey = event.coverimage.startsWith("https://")
              ? event.coverimage.split("/").slice(3).join("/")
              : event.coverimage
            const presignedUrl = await generatePresignedUrl(coverKey)
            if (presignedUrl) {
              file_url = presignedUrl
            }
          } catch (err) {
            console.error(`Error generating presigned URL for event ${event.id}:`, err)
          }
        }
        return {
          ...event,
          file_url,
          link: `/customerviewevent/${event.id}`,
        }
      }),
    )
    console.log(`Found ${events.length} available events`)
    res.json(events)
  } catch (error) {
    console.error("Error fetching available events:", error)
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

// Admin endpoint to update event status
app.put("/api/admin/event/:eventId/status", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params
    const { status, comment } = req.body

    console.log(`Updating status for event ID: ${eventId} to ${status}`)

    if (!["Approved", "Rejected", "Request Edit", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" })
    }

    const result = await pool.query(
      "UPDATE events SET status = $1, admin_comment = $2 WHERE event_id = $3 RETURNING *",
      [status, comment, eventId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" })
    }

    res.json({ message: "Event status updated successfully", event: result.rows[0] })
  } catch (error) {
    console.error("Error updating event status:", error)
    res.status(500).json({ error: "Failed to update event status" })
  }
})

// Admin endpoint to get proof of payment for an event
app.get("/api/admin/event/:eventId/proof-of-payment", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params

    const result = await pool.query("SELECT proof_of_payment FROM payments WHERE event_id = $1", [eventId])

    if (result.rows.length === 0 || !result.rows[0].proof_of_payment) {
      return res.status(404).json({ error: "Proof of payment not found" })
    }

    // Generate a presigned URL for the proof of payment
    const proofOfPaymentKey = result.rows[0].proof_of_payment
    const url = await generatePresignedUrl(proofOfPaymentKey)

    if (!url) {
      return res.status(500).json({ error: "Failed to generate URL for proof of payment" })
    }

    res.json({ url })
  } catch (error) {
    console.error("Error fetching proof of payment:", error)
    res.status(500).json({ error: "Failed to fetch proof of payment" })
  }
})

// Public endpoint to get approved events that haven't passed their deadline
// No authentication required for this endpoint
app.get("/api/events/available", async (req, res) => {
  try {
    console.log("Fetching available events...")

    // Return mock data without accessing the database
    const mockEvents = [
      {
        id: 1,
        name: "Sample Event 1",
        location: "Sample Location 1",
        date: "July 15",
        time: "9 am",
        image: "/default-event-image.png",
        link: "/customerviewevent/1",
        description: "This is a sample event description",
        capacity: 100,
        event_type: "Conference",
      },
      {
        id: 2,
        name: "Sample Event 2",
        location: "Sample Location 2",
        date: "July 20",
        time: "10 am",
        image: "/default-event-image.png",
        link: "/customerviewevent/2",
        description: "Another sample event description",
        capacity: 50,
        event_type: "Workshop",
      },
    ]

    console.log("Sending response with mock events:", mockEvents.length)
    res.json(mockEvents)
  } catch (error) {
    console.error("Error in mock events endpoint:", error)
    console.error("Error details:", error.message)
    console.error("Error stack:", error.stack)
    res.status(500).json({ error: "Failed to fetch available events" })
  }
})

// User registration
app.post("/api/register", async (req, res) => {
  logRequest(req)
  console.log("Starting registration process...")

  const client = await pool.connect()
  try {
    console.log("Received registration data:", req.body)

    const { name, email, password, phone, institution, faculty_id, department_id, ieee_number, vat_number } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      console.error("Missing required fields")
      return res.status(400).json({ message: "Name, email, and password are required" })
    }

    const { firstName, lastName } = splitName(name)
    console.log("Processed name:", { firstName, lastName })

    // Check if user exists
    console.log("Checking if user exists...")
    const userExists = await client.query("SELECT user_id FROM user_profiles WHERE email = $1", [email])

    if (userExists.rows.length > 0) {
      console.log("User already exists:", email)
      return res.status(400).json({ message: "User with this email already exists" })
    }

    // Hash password
    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 10)

    await client.query("BEGIN")
    console.log("Transaction started")

    try {
      // Get the next user_id
      const userIdResult = await client.query("SELECT COALESCE(MAX(user_id), 0) + 1 AS next_user_id FROM user_profiles")
      const nextUserId = userIdResult.rows[0].next_user_id
      console.log("Next user_id:", nextUserId)

      // Insert into user_profiles table
      const userQuery = `
        INSERT INTO user_profiles (user_id, firstname, surname, email, password, role, cellnumber, institution, faculty_id, department_id, ieee_no, vat_no)
        VALUES ($1, $2, $3, $4, $5, 'user', $6, $7, $8, $9, $10, $11)
        RETURNING user_id, email, role;
      `

      const userResult = await client.query(userQuery, [
        nextUserId,
        firstName,
        lastName,
        email,
        hashedPassword,
        phone,
        institution,
        faculty_id,
        department_id,
        ieee_number,
        vat_number,
      ])
      const user = userResult.rows[0]
      console.log("Generated user_id:", user.user_id)
      console.log("User created:", user)

      await client.query("COMMIT")
      console.log("Transaction committed")

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          name: `${firstName} ${lastName}`.trim(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      )

      res.json({ token, message: "Registration successful" })
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Transaction error:", error)
      res.status(500).json({ message: "Registration failed" })
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ message: "An error occurred" })
  } finally {
    client.release()
  }
})

// User login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Find user by email in user_profiles table
    const result = await pool.query(
      `SELECT user_id, email, password, role, 
              firstname, surname, cellnumber, institution,
              faculty_id, department_id, ieee_no, vat_no, is_disabled
       FROM user_profiles
       WHERE email = $1`,
      [email.toLowerCase()],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const user = result.rows[0]

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check if user account is disabled
    if (user.is_disabled === 1) {
      return res.status(403).json({ message: "This account has been disabled. Please contact an administrator." })
    }

    // Check if user is an admin based on role field
    const isAdmin = user.role === "Admin"

    // Generate JWT token
    console.log("Generating JWT token for user:", user.user_id, "with role:", user.role)
    console.log("JWT_SECRET is set:", !!process.env.JWT_SECRET)

    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.role || "user",
      name: `${user.firstname || ""} ${user.surname || ""}`.trim() || user.email,
    }

    console.log("Token payload:", payload)

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" })

    console.log("Generated token (first 10 chars):", token.substring(0, 10) + "...")

    // Return user data without sensitive information
    const userResponse = {
      id: user.user_id,
      email: user.email,
      role: user.role,
      isAdmin: isAdmin,
      firstname: user.firstname,
      surname: user.surname,
      name: `${user.firstname || ""} ${user.surname || ""}`.trim(),
      cellnumber: user.cellnumber,
      institution: user.institution,
      faculty_id: user.faculty_id,
      department_id: user.department_id,
      ieee_no: user.ieee_no,
      vat_no: user.vat_no,
    }

    console.log(`User ${user.email} logged in with role: ${user.role}, isAdmin: ${isAdmin}`)

    res.json({
      token,
      user: userResponse,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login", error: error.message })
  }
})

// Toggle user disabled status
app.post("/api/toggle-user-status", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" })
    }

    // Get current user status
    const userResult = await pool.query("SELECT is_disabled FROM user_profiles WHERE user_id = $1", [userId])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentStatus = userResult.rows[0].is_disabled || 0
    const newStatus = currentStatus === 1 ? 0 : 1

    // Update user status
    await pool.query("UPDATE user_profiles SET is_disabled = $1 WHERE user_id = $2", [newStatus, userId])

    res.json({
      message: `User account ${newStatus === 1 ? "disabled" : "enabled"} successfully`,
      status: newStatus,
    })
  } catch (error) {
    console.error("Error toggling user status:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get users with events (organizers)
app.get("/api/users-with-events", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    console.log("Fetching users with events, authenticated as:", req.user)
    const result = await pool.query(`
      SELECT DISTINCT u.user_id, u.firstname, u.surname, u.email, u.role, u.is_disabled,
             e.name as event_name, e.startdate, TO_CHAR(e.startdate, 'DD/MM/YYYY') as formatted_date
      FROM user_profiles u
      JOIN events e ON u.user_id = e.user_id
      ORDER BY u.surname, u.firstname
    `)

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching users with events:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get users without events (general users)
app.get("/api/users-without-events", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    console.log("Fetching users without events, authenticated as:", req.user)
    const result = await pool.query(`
      SELECT u.user_id, u.firstname, u.surname, u.email, u.role, u.is_disabled
      FROM user_profiles u
      WHERE NOT EXISTS (
        SELECT 1 FROM events e WHERE e.user_id = u.user_id
      )
      ORDER BY u.surname, u.firstname
    `)

    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching users without events:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

//Leya organizer code

app.get("/api/events", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { userId, role } = req.user

    const currentDate = new Date().toISOString().split("T")[0]

    let query = `
      SELECT 
        e.event_id as id,
        e.name,
        e.description,
        e.terms_and_conditions,
        e.location,
        e.startdate as start_date,
        e.enddate as end_date,
        e.time as start_time,
        e.endtime as end_time,
        e.duration,
        e.deadlinetime as registration_deadline_time,
        e.deadlinedate as registration_deadline_date,
        e.type as event_type,
        e.capacity,
        e.attendees,
        e.coverimage,
        e.tabs,
        e.packages,
        e.status
      FROM events e
    `

    const queryParams = []
    if (role === "Admin") {
      // Admin sees all events with enddate in the future
      query += ` WHERE e.enddate > $1`
      queryParams.push(currentDate)
    } else {
      // Organizer sees their own events with enddate in the future
      query += ` WHERE e.user_id = $1 AND e.enddate > $2`
      queryParams.push(userId, currentDate)
    }

    query += ` ORDER BY e.startdate DESC, e.time DESC`

    const result = await client.query(query, queryParams)

    const eventsWithPresignedUrls = await Promise.all(
      result.rows.map(async (event) => {
        let coverImageUrl = "/default-profile-picture.jpg"
        if (event.coverimage) {
          const coverKey = event.coverimage.split("/").slice(3).join("/")
          try {
            coverImageUrl = await generatePresignedUrl(coverKey)
          } catch (e) {
            console.warn("Failed to generate signed URL for cover image:", e)
          }
        }

        const parsedTabs = event.tabs
          ? event.tabs.map((tab) => {
              try {
                return JSON.parse(tab)
              } catch (e) {
                console.warn(`Failed to parse tab: ${tab}`, e)
                return {}
              }
            })
          : []

        const parsedPackages = event.packages
          ? event.packages.map((pkg) => {
              try {
                return JSON.parse(pkg)
              } catch (e) {
                console.warn(`Failed to parse package: ${pkg}`, e)
                return {}
              }
            })
          : []

        return {
          ...event,
          coverimage: coverImageUrl,
          tabs: parsedTabs,
          packages: parsedPackages,
        }
      }),
    )

    res.json(eventsWithPresignedUrls)
  } catch (error) {
    console.error("Error fetching events:", error)
    res.status(500).json({
      error: "Failed to fetch events",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

app.post("/api/events", authenticateToken, upload.fields([{ name: "cover_image", maxCount: 1 }]), async (req, res) => {
  console.log("Received /api/events request")
  console.log("Files received:", req.files)
  console.log("Body:", req.body)
  console.log("Raw packages:", req.body.packages)
  const client = await pool.connect()
  try {
    const {
      name,
      description,
      terms_and_conditions,
      location,
      startdate,
      enddate,
      time: start_time,
      endtime: end_time,
      deadlinedate,
      deadlinetime,
      type,
      capacity,
      duration,
      attendees,
      tabs,
      packages,
    } = req.body

    // Validate required fields
    const missingFields = []
    if (!name || name.trim() === "") missingFields.push("name")
    if (!location || location.trim() === "") missingFields.push("location")
    if (!startdate || startdate.trim() === "") missingFields.push("startdate")
    if (!enddate || enddate.trim() === "") missingFields.push("enddate")
    if (!start_time || start_time.trim() === "") missingFields.push("time")
    if (!end_time || end_time.trim() === "") missingFields.push("endtime")
    if (!duration || duration.trim() === "") missingFields.push("duration")
    if (!deadlinedate || deadlinedate.trim() === "") missingFields.push("deadlinedate")
    if (!deadlinetime || deadlinetime.trim() === "") missingFields.push("deadlinetime")
    if (!type || type.trim() === "") missingFields.push("type")
    if (!capacity || capacity.trim() === "") missingFields.push("capacity")
    if (!attendees || attendees.trim() === "") missingFields.push("attendees")
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields)
      return res.status(400).json({
        error: "Missing required fields",
        details: `The following fields are missing or empty: ${missingFields.join(", ")}`,
      })
    }

    // Validate cover image
    if (!req.files || !req.files["cover_image"] || !req.files["cover_image"][0]) {
      console.error("No cover image file received")
      return res.status(400).json({ error: "Cover image is required" })
    }
    const coverImageFile = req.files["cover_image"][0]
    if (!["image/jpeg", "image/png"].includes(coverImageFile.mimetype)) {
      console.error("Invalid cover image type:", coverImageFile.mimetype)
      return res.status(400).json({ error: "Cover image must be JPEG or PNG" })
    }

    // Validate registration deadline (must be before event start date)
    const eventStartDate = new Date(`${startdate}T${start_time}`)
    const deadlineDate = new Date(`${deadlinedate}T${deadlinetime}`)
    if (isNaN(eventStartDate.getTime()) || isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format for event start or registration deadline" })
    }
    if (deadlineDate >= eventStartDate) {
      return res.status(400).json({
        error: "Registration deadline must be before event start date",
      })
    }

    let parsedAttendees = []
    let parsedTabs = []
    let parsedPackages = []
    try {
      parsedAttendees = attendees.startsWith("{")
        ? attendees
            .slice(1, -1)
            .split(",")
            .filter((item) => item.trim())
        : JSON.parse(attendees || "[]")
      parsedTabs = JSON.parse(tabs || "[]").map((tab) => JSON.stringify(tab))
      parsedPackages = JSON.parse(packages || "[]").map((pkg, index) => {
        console.log("Processing package:", pkg)
        if (!pkg.startDate || !pkg.endDate) {
          throw new Error(`Package ${index + 1} is missing startDate or endDate`)
        }
        if (isNaN(new Date(pkg.startDate).getTime()) || isNaN(new Date(pkg.endDate).getTime())) {
          throw new Error(`Invalid date format in package ${index + 1}`)
        }
        if (new Date(pkg.endDate) < new Date(pkg.startDate)) {
          throw new Error(`End date before start date in package ${index + 1}`)
        }
        // Validate package start date (at least one week before registration deadline)
        const packageStartDate = new Date(pkg.startDate)
        const packageEndDate = new Date(pkg.endDate)
        const deadlineDateObj = new Date(deadlinedate)
        const minPackageDate = new Date(deadlineDateObj)
        minPackageDate.setDate(deadlineDateObj.getDate() - 7)
        if (packageStartDate > minPackageDate) {
          throw new Error(`Package ${index + 1} start date must be at least one week before registration deadline`)
        }
        // Validate package end date (before registration deadline)
        if (packageEndDate >= deadlineDateObj) {
          throw new Error(`Package ${index + 1} end date must be before registration deadline`)
        }
        return JSON.stringify(pkg)
      })
      console.log("Parsed packages:", parsedPackages)
    } catch (e) {
      console.error("JSON parsing or validation error:", e.message)
      return res.status(400).json({
        error: "Invalid JSON format or validation error for attendees, tabs, or packages",
        details: e.message,
      })
    }

    await client.query("BEGIN")
    // Upload cover image to S3
    let coverImageUrl
    let coverImageKey
    try {
      const file = req.files["cover_image"][0]
      const sanitizedFileName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")
      coverImageKey = `cover_images/${Date.now()}_${sanitizedFileName}`
      const coverImageCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: coverImageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      await s3Client.send(coverImageCommand)
      coverImageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.af-south-1.amazonaws.com/${coverImageKey}`
      console.log("Cover image uploaded successfully:", coverImageUrl)
      if (!coverImageUrl || typeof coverImageUrl !== "string" || !coverImageUrl.startsWith("https://")) {
        throw new Error("Invalid cover image URL after upload")
      }
    } catch (error) {
      console.error("Failed to upload cover image to S3:", error)
      throw new Error(`Cover image upload failed: ${error.message}`)
    }

    // Insert event
    const queryParams = [
      name,
      location,
      startdate,
      enddate,
      start_time,
      duration,
      deadlinedate,
      deadlinetime,
      type,
      Number.parseInt(capacity, 10),
      `{${parsedAttendees.join(",")}}`,
      null, // contactnum
      null, // email
      coverImageUrl,
      parsedTabs,
      parsedPackages,
      description || null,
      terms_and_conditions || null,
      end_time || null,
      req.user.userId,
      "pending",
    ]
    const eventResult = await client.query(
      `INSERT INTO events (
         name, location, startdate, enddate, time, duration, deadlinedate, deadlinetime,
         type, capacity, attendees, contactnum, email, coverimage, tabs, packages,
         description, terms_and_conditions, endtime, user_id, status
      ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING event_id`,
      queryParams,
    )
    const event_id = eventResult.rows[0].event_id
    console.log("Event created with ID:", event_id)
    await client.query("COMMIT")
    console.log("Transaction committed")
    const finalEvent = await client.query(`SELECT * FROM events WHERE event_id = $1`, [event_id])
    const finalCoverImageUrl = coverImageKey ? await generatePresignedUrl(coverImageKey) : coverImageUrl
    console.log("Event created:", finalEvent.rows[0])
    res.status(200).json({
      message: "Event created successfully",
      coverImageUrl: finalCoverImageUrl,
      event: finalEvent.rows[0],
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error creating event:", error)
    res.status(500).json({ error: "Failed to create event", details: error.message })
  } finally {
    client.release()
  }
})

//Get all the events for the logged in user

// Get single event by ID
app.put(
  "/api/events/:eventId",
  authenticateToken,
  upload.fields([{ name: "cover_image", maxCount: 1 }]),
  async (req, res) => {
    const client = await pool.connect()
    try {
      const { eventId } = req.params
      const userId = req.user.userId
      const {
        name,
        description,
        location,
        start_date,
        end_date,
        start_time,
        end_time,
        duration,
        deadlinetime,
        deadlinedate,
        event_type,
        capacity,
        attendees,
        contactnum,
        email,
        tabs,
        packages,
        terms_and_conditions,
      } = req.body
      console.log("Received packages:", req.body.packages)

      // Validate ownership and status
      const ownershipCheck = await client.query(
        `SELECT event_id, status FROM events
        WHERE event_id = $1 AND user_id = $2
        AND (status = 'Request Edit' OR status = 'pending' OR $3 = true)`,
        [eventId, userId, req.user.role === "Admin"],
      )
      if (ownershipCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Not authorized to update this event or event not in editable status",
        })
      }

      // Validate required fields
      const missingFields = []
      if (!name || name.trim() === "") missingFields.push("name")
      if (!location || location.trim() === "") missingFields.push("location")
      if (!start_date || start_date.trim() === "") missingFields.push("start_date")
      if (!end_date || end_date.trim() === "") missingFields.push("end_date")
      if (!start_time || start_time.trim() === "") missingFields.push("start_time")
      if (!end_time || end_time.trim() === "") missingFields.push("end_time")
      if (!duration || duration.trim() === "") missingFields.push("duration")
      if (!deadlinedate || deadlinedate.trim() === "") missingFields.push("deadlinedate")
      if (!deadlinetime || deadlinetime.trim() === "") missingFields.push("deadlinetime")
      if (!event_type || event_type.trim() === "") missingFields.push("event_type")
      if (!capacity || capacity.trim() === "") missingFields.push("capacity")
      if (!attendees || attendees.trim() === "") missingFields.push("attendees")
      if (missingFields.length > 0) {
        console.log("Missing fields:", missingFields)
        return res.status(400).json({
          error: "Missing required fields",
          details: `The following fields are missing or empty: ${missingFields.join(", ")}`,
        })
      }

      // Validate registration deadline (must be before event start date)
      if (start_date && deadlinedate && start_time && deadlinetime) {
        const eventStartDate = new Date(`${start_date}T${start_time}`)
        const deadlineDate = new Date(`${deadlinedate}T${deadlinetime}`)
        if (isNaN(eventStartDate.getTime()) || isNaN(deadlineDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format for event start or registration deadline" })
        }
        if (deadlineDate >= eventStartDate) {
          return res.status(400).json({
            error: "Registration deadline must be before event start date",
          })
        }
      }

      let parsedAttendees = []
      let parsedTabs = tabs
      let parsedPackages = packages
      try {
        // Parse attendees
        if (typeof attendees === "string") {
          if (attendees.startsWith("{") && attendees.endsWith("}")) {
            parsedAttendees = attendees
              .slice(1, -1)
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          } else if (attendees.startsWith("[") && attendees.endsWith("]")) {
            parsedAttendees = JSON.parse(attendees)
              .map((item) => item.trim())
              .filter((item) => item)
          } else {
            // Handle plain string case
            parsedAttendees = [attendees.trim()]
          }
        } else if (Array.isArray(attendees)) {
          parsedAttendees = attendees.map((item) => item.trim()).filter((item) => item)
        }
        // Validate attendee types
        const validAttendeeTypes = ["Student", "Professional", "Guest", "Sponsor", "Exhibitor"]
        parsedAttendees = parsedAttendees.filter((type) => validAttendeeTypes.includes(type))
        if (parsedAttendees.length === 0) {
          return res.status(400).json({ error: "At least one valid attendee type is required" })
        }

        // Parse tabs
        parsedTabs = tabs ? JSON.parse(tabs).map((tab) => JSON.stringify(tab)) : null
        // Parse and validate packages
        parsedPackages = packages
          ? JSON.parse(packages).map((pkg, index) => {
              console.log(`Processing package ${index}:`, pkg)
              // ... (rest of the code remains the same)
              if (!pkg.startDate || !pkg.endDate) {
                throw new Error(`Package ${index + 1} is missing startDate or endDate`)
              }
              if (isNaN(new Date(pkg.startDate).getTime()) || isNaN(new Date(pkg.endDate).getTime())) {
                throw new Error(`Invalid date format in package ${index + 1}`)
              }
              if (new Date(pkg.endDate) < new Date(pkg.startDate)) {
                throw new Error(`End date before start date in package ${index + 1}`)
              }
              // Validate package start date (at least one week before registration deadline)
              if (deadlinedate) {
                const packageStartDate = new Date(pkg.startDate)
                const packageEndDate = new Date(pkg.endDate)
                const deadlineDateObj = new Date(deadlinedate)
                const minPackageDate = new Date(deadlineDateObj)
                minPackageDate.setDate(deadlineDateObj.getDate() - 7)
                if (packageStartDate > minPackageDate) {
                  throw new Error(
                    `Package ${index + 1} start date must be at least one week before registration deadline`,
                  )
                }
                // Validate package end date (before registration deadline)
                if (packageEndDate >= deadlineDateObj) {
                  throw new Error(`Package ${index + 1} end date must be before registration deadline`)
                }
              }
              // Validate pricing
              if (!pkg.pricing || !/^\d+(\.\d{1,2})?$/.test(pkg.pricing)) {
                throw new Error(`Package ${index + 1} pricing must be a valid number (e.g., 123.45)`)
              }
              if (Number.parseFloat(pkg.pricing) <= 0) {
                throw new Error(`Package ${index + 1} pricing must be greater than 0`)
              }
              return JSON.stringify(pkg)
            })
          : null
        console.log("Parsed packages:", parsedPackages)
      } catch (e) {
        return res.status(400).json({
          error: "Invalid JSON format or validation error for attendees, tabs, or packages",
          details: e.message,
        })
      }

      await client.query("BEGIN")

      const updateEventQuery = `
      UPDATE events
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          location = COALESCE($3, location),
          startdate = COALESCE($4, startdate),
          enddate = COALESCE($5, enddate),
          time = COALESCE($6, time),
          endtime = COALESCE($7, endtime),
          duration = COALESCE($8, duration),
          deadlinetime = COALESCE($9, deadlinetime),
          deadlinedate = COALESCE($10, deadlinedate),
          type = COALESCE($11, type),
          capacity = COALESCE($12, capacity),
          attendees = COALESCE($13, attendees),
          contactnum = COALESCE($14, contactnum),
          email = COALESCE($15, email),
          tabs = COALESCE($16, tabs),
          packages = COALESCE($17, packages),
          terms_and_conditions = COALESCE($18, terms_and_conditions),
          status = $19
      WHERE event_id = $20
      RETURNING *;
    `
      const eventValues = [
        name,
        description,
        location,
        start_date,
        end_date,
        start_time,
        end_time,
        duration,
        deadlinetime,
        deadlinedate,
        event_type,
        Number.parseInt(capacity, 10),
        `{${parsedAttendees.join(",")}}`,
        contactnum,
        email,
        parsedTabs,
        parsedPackages,
        terms_and_conditions,
        "pending",
        eventId,
      ]
      const eventResult = await client.query(updateEventQuery, eventValues)
      if (eventResult.rows.length === 0) {
        return res.status(404).json({ error: "Event not found" })
      }

      let coverImageUrl = null
      let coverImageKey = null
      if (req.files && req.files["cover_image"]) {
        const file = req.files["cover_image"][0]
        if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
          await client.query("ROLLBACK")
          return res.status(400).json({ error: "Cover image must be JPEG or PNG" })
        }
        const sanitizedFileName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")
        coverImageKey = `cover_images/${eventId}/${Date.now()}_${sanitizedFileName}`
        const coverImageCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: coverImageKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        await s3Client.send(coverImageCommand)
        coverImageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.af-south-1.amazonaws.com/${coverImageKey}`
        console.log("Cover image uploaded:", coverImageUrl)
        await client.query("UPDATE events SET coverimage = $1 WHERE event_id = $2", [coverImageUrl, eventId])
      }

      await client.query("COMMIT")
      const {
        rows: [updatedEvent],
      } = await client.query(
        `SELECT e.*,
              up.firstname, up.surname, up.email, up.cellnumber
       FROM events e
       LEFT JOIN user_profiles up ON e.user_id = up.user_id
       WHERE e.event_id = $1`,
        [eventId],
      )
      const finalCoverImageUrl = updatedEvent.coverimage
        ? await generatePresignedUrl(updatedEvent.coverimage.split("/").slice(3).join("/"))
        : "/default-profile-picture.jpg"
      res.json({
        message: "Event updated successfully and set to pending",
        event: {
          ...updatedEvent,
          coverimage: finalCoverImageUrl,
        },
        coverImageUrl: finalCoverImageUrl,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error updating event:", error)
      res.status(500).json({
        error: "Failed to update event",
        details: error.message,
      })
    } finally {
      client.release()
    }
  },
)

// // Admin routes
// // Get all events for admin (all users' events)
// app.get("/api/admin/events", authenticateToken, async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { role } = req.user;

//     // Check if user is admin
//     if (role !== "Admin") {
//       return res.status(403).json({
//         error: "Access denied. Admin privileges required.",
//       });
//     }

//     const query = `
//       SELECT
//         e.event_id as id,
//         e.name as event_name,
//         e.description,
//         e.terms_and_conditions,
//         e.location,
//         e.startdate as date,
//         e.enddate as end_date,
//         e.time,
//         e.endtime as end_time,
//         e.duration,
//         e.deadlinetime as registration_deadline_time,
//         e.deadlinedate as registration_deadline_date,
//         e.type as event_type,
//         e.capacity,
//         e.attendees,
//         e.contactnum,
//         e.email,
//         e.coverimage,
//         e.tabs,
//         e.packages,
//         e.status,
//         e.admin_comment,
//         e.user_id,
//         p.amount as paid_amount,
//         p.payment_type,
//         p.proof_of_payment as payment_proof_key,
//         up.firstname as organizer_first_name,
//         up.surname as organizer_last_name,
//         up.cellnumber as organizer_phone,
//         up.email as organizer_email
//       FROM events e
//       LEFT JOIN payments p ON e.event_id = p.event_id
//       LEFT JOIN user_profiles up ON e.user_id = up.user_id
//       ORDER BY e.startdate DESC, e.time DESC
//     `;

//     console.log("Admin fetching all events");
//     const result = await client.query(query);

//     const eventsWithUrls = await Promise.all(
//       result.rows.map(async (event) => {
//         let coverImageUrl = "/default-profile-picture.jpg";
//         let proofOfPaymentUrl = null;

//         if (event.coverimage) {
//           const coverKey = event.coverimage.split("/").slice(3).join("/");
//           try {
//             coverImageUrl = await generatePresignedUrl(coverKey);
//           } catch (e) {
//             console.warn("Failed to generate signed URL for cover image:", e);
//           }
//         }

//         if (event.payment_proof_key) {
//           const proofKey = event.payment_proof_key.split("/").slice(3).join("/");
//           try {
//             proofOfPaymentUrl = await generatePresignedUrl(proofKey);
//           } catch (e) {
//             console.warn("Failed to generate signed URL for proof of payment:", e);
//           }
//         }

//         const parsedTabs = event.tabs
//           ? event.tabs.map((tab) => {
//             try {
//               return JSON.parse(tab);
//             } catch (e) {
//               console.warn(`Failed to parse tab: ${tab}`, e);
//               return {};
//             }
//           })
//           : [];

//         const parsedPackages = event.packages
//           ? event.packages.map((pkg) => {
//             try {
//               return JSON.parse(pkg);
//             } catch (e) {
//               console.warn(`Failed to parse package: ${pkg}`, e);
//               return {};
//             }
//           })
//           : [];

//         return {
//           id: event.id,
//           event_name: event.event_name,
//           description: event.description,
//           terms_and_conditions: event.terms_and_conditions,
//           location: event.location,
//           date: event.date,
//           end_date: event.end_date,
//           time: event.time,
//           end_time: event.end_time,
//           duration: event.duration,
//           registration_deadline_time: event.registration_deadline_time,
//           registration_deadline_date: event.registration_deadline_date,
//           event_type: event.event_type,
//           capacity: event.capacity,
//           attendees: event.attendees,
//           contactnum: event.contactnum,
//           email: event.email,
//           status: event.status,
//           admin_comment: event.admin_comment,
//           user_id: event.user_id,
//           paid_amount: event.paid_amount,
//           payment_type: event.payment_type,
//           payment_proof_key: event.payment_proof_key,
//           coverimage: coverImageUrl,
//           file_url: coverImageUrl, // used on frontend
//           payment_proof_url: proofOfPaymentUrl,
//           tabs: parsedTabs,
//           packages: parsedPackages,
//           organizer: {
//             name: `${event.organizer_first_name || ""} ${event.organizer_last_name || ""}`.trim(),
//             phone: event.organizer_phone || "N/A",
//             email: event.organizer_email || "N/A",
//           },
//         };
//       })
//     );

//     console.log("Admin events fetched:", eventsWithUrls.length, "events");
//     res.json(eventsWithUrls);
//   } catch (error) {
//     console.error("Error fetching admin events:", error);
//     res.status(500).json({
//       error: "Failed to fetch events",
//       details: error.message,
//     });
//   } finally {
//     client.release();
//   }
// });

// // Get specific event by ID for admin (can access any event)
// app.get("/api/admin/events/:eventId", authenticateToken, async (req, res) => {
//   const client = await pool.connect()

//   try {
//     const { eventId } = req.params
//     const { role } = req.user

//     // Check if user is admin
//     if (role !== "Admin") {
//       return res.status(403).json({
//         error: "Access denied. Admin privileges required.",
//       })
//     }

//     const query = `
//       SELECT
//         e.event_id as id,
//         e.name,
//         e.description,
//         e.location,
//         e.startdate as start_date,
//         e.enddate as end_date,
//         e.time as start_time,
//         e.endtime as end_time,
//         e.duration,
//         e.deadlinetime as registration_deadline_time,
//         e.deadlinedate as registration_deadline_date,
//         e.type as event_type,
//         e.capacity,
//         e.attendees,
//         e.contactnum,
//         e.email,
//         e.coverimage,
//         e.tabs,
//         e.packages,
//         e.terms_and_conditions,
//         e.status,
//         e.admin_comment,
//         e.user_id,
//         p.payment_id,
//         p.amount as paid_amount,
//         p.payment_type,
//         p.proof_of_payment as payment_proof_key,
//         up.firstname as organizer_first_name,
//         up.surname as organizer_last_name,
//         up.cellnumber as organizer_phone,
//         up.email as organizer_email
//       FROM events e
//       LEFT JOIN payments p ON e.event_id = e.event_id
//       LEFT JOIN user_profiles up ON e.user_id = up.user_id
//       WHERE e.event_id = $1
//     `

//     console.log("Admin fetching event by ID:", eventId)
//     console.log("Query:", query)

//     const result = await client.query(query, [eventId])

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Event not found" })
//     }

//     const event = result.rows[0]

//     // Generate presigned URLs
//     let coverImageUrl = "/default-profile-picture.jpg"
//     let proofOfPaymentUrl = null

//     if (event.coverimage) {
//       const coverKey = event.coverimage.split("/").slice(3).join("/")
//       if (coverKey) {
//         try {
//           coverImageUrl = await generatePresignedUrl(coverKey)
//         } catch (e) {
//           console.warn("Failed to generate signed URL for cover image:", e)
//         }
//       }
//     }

//     if (event.payment_proof_key) {
//       const proofKey = event.payment_proof_key.split("/").slice(3).join("/")
//       if (proofKey) {
//         try {
//           proofOfPaymentUrl = await generatePresignedUrl(proofKey)
//         } catch (e) {
//           console.warn("Failed to generate signed URL for proof of payment:", e)
//         }
//       }
//     }

//     // Parse tabs and packages
//     event.tabs = event.tabs
//       ? event.tabs.map((tab) => {
//         try {
//           return JSON.parse(tab)
//         } catch (e) {
//           console.warn(`Failed to parse tab: ${tab}`, e)
//           return {}
//         }
//       })
//       : []

//     event.packages = event.packages
//       ? event.packages.map((pkg) => {
//         try {
//           return JSON.parse(pkg)
//         } catch (e) {
//           console.warn(`Failed to parse package: ${pkg}`, e)
//           return {}
//         }
//       })
//       : []

//     // Format organizer data
//     event.organizer = {
//       name: `${event.organizer_first_name || ""} ${event.organizer_last_name || ""}`.trim(),
//       phone: event.organizer_phone || "N/A",
//       email: event.organizer_email || "N/A",
//       amount:
//         event.payment_type === "Sponsor" && event.paid_amount
//           ? `R ${Number.parseFloat(event.paid_amount).toFixed(2)}`
//           : "",
//     }

//     res.json({
//       ...event,
//       coverimage: coverImageUrl,
//       payment_proof_url: proofOfPaymentUrl,
//     })
//   } catch (error) {
//     console.error("Error fetching admin event:", error)
//     res.status(500).json({
//       message: "Failed to fetch event",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     })
//   } finally {
//     client.release()
//   }
// })

// // Delete an event
// app.delete('/api/events/:eventId', authenticateToken, async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const { eventId } = req.params;
//     const { userId, role } = req.user;

//     // Check if the user is the organizer or an admin
//     const eventCheck = await client.query(
//       'SELECT event_id FROM events WHERE event_id = $1 AND (user_id = $2 OR $3 = true)',
//       [eventId, userId, role === 'Admin']
//     );

//     if (eventCheck.rows.length === 0) {
//       return res.status(404).json({ error: 'Event not found or access denied' });
//     }

//     await client.query('BEGIN');

//     // Delete related records
//     await client.query('DELETE FROM payments WHERE event_id = $1', [eventId]);

//     // Delete the event
//     const result = await client.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [eventId]);

//     if (result.rows.length === 0) {
//       throw new Error('Event not found after verification');
//     }

//     await client.query('COMMIT');

//     res.json({ message: 'Event deleted successfully', event: result.rows[0] });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Error deleting event:', error);
//     res.status(500).json({
//       error: 'Failed to delete event',
//       details: error.message
//     });
//   } finally {
//     client.release();
//   }
// });

// Faculty & Department lookup endpoints
app.get("/api/faculties", async (req, res) => {
  try {
    const facultiesResult = await pool.query(
      "SELECT faculty_id AS value, faculty_name AS label FROM faculties ORDER BY faculty_name",
    )
    res.json(facultiesResult.rows)
  } catch (error) {
    console.error("Error fetching faculties:", error)
    res.status(500).json({
      message: "Failed to fetch faculties",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

app.get("/api/departments", async (req, res) => {
  try {
    const { facultyId } = req.query
    let query
    let queryParams = []

    if (facultyId) {
      query = `
        SELECT 
          d.department_id AS value, 
          d.department_name AS label,
          f.faculty_name
        FROM departments d
        JOIN faculties f ON d.faculty_id = f.faculty_id
        WHERE d.faculty_id = $1
        ORDER BY d.department_name`
      queryParams = [facultyId]
    } else {
      query = `
        SELECT 
          d.department_id AS value, 
          d.department_name AS label,
          f.faculty_name
        FROM departments d
        JOIN faculties f ON d.faculty_id = f.faculty_id
        ORDER BY f.faculty_name, d.department_name`
    }

    const departmentsResult = await pool.query(query, queryParams)
    res.json(departmentsResult.rows)
  } catch (error) {
    console.error("Error fetching departments:", error)
    res.status(500).json({
      message: "Failed to fetch departments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Admin endpoint to get proof of payment for an event
app.get("/api/admin/event/:eventId/proof-of-payment", authenticateToken, authenticateAdmin, async (req, res) => {
  const client = await pool.connect()
  try {
    const { eventId } = req.params
    const result = await client.query("SELECT proof_of_payment FROM payments WHERE event_id = $1", [eventId])

    if (result.rows.length === 0 || !result.rows[0].proof_of_payment) {
      return res.status(404).json({ error: "Proof of payment not found" })
    }

    res.status(200).json({ url: result.rows[0].proof_of_payment })
  } catch (err) {
    console.error("Error fetching proof of payment:", err)
    res.status(500).json({ error: "Failed to fetch proof of payment", details: err.message })
  } finally {
    client.release()
  }
})

// Admin endpoint to update event status
app.put("/api/admin/event/:eventId/status", authenticateToken, authenticateAdmin, async (req, res) => {
  const client = await pool.connect()
  try {
    const { eventId } = req.params
    const { status, comment } = req.body

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" })
    }

    if (!status || !["Approved", "Rejected", "Request Edit", "pending"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required (Approved, Rejected, Request Edit, or pending)" })
    }

    await client.query("BEGIN")

    // Update the event status in the database
    const updateResult = await client.query(
      "UPDATE events SET status = $1, admin_comment = $2 WHERE event_id = $3 RETURNING *",
      [status, comment || null, eventId],
    )

    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Event not found" })
    }

    await client.query("COMMIT")

    res.status(200).json({
      message: `Event status updated to ${status}`,
      event: updateResult.rows[0],
    })
  } catch (err) {
    await client.query("ROLLBACK")
    console.error("Error updating event status:", err)
    res.status(500).json({ error: "Failed to update event status", details: err.message })
  } finally {
    client.release()
  }
})

// Get users who have events
app.get("/api/users-with-events", async (req, res) => {
  const client = await pool.connect()
  try {
    const query = `
      SELECT 
        up.user_id, 
        up.firstname, 
        up.surname, 
        up.email, 
        e.name as event_name, 
        e.startdate,
        TO_CHAR(e.startdate, 'YYYY-MM-DD') as formatted_date
      FROM 
        user_profiles up 
      INNER JOIN 
        events e ON up.user_id = e.user_id
    `
    const result = await client.query(query)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching users with events:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
})

// Get all customers
app.get("/api/customers", async (req, res) => {
  const client = await pool.connect()
  try {
    // Simplified query that works regardless of schema
    const query = `
      SELECT 
        user_id, 
        firstname, 
        surname, 
        email, 
        phone_number,
        created_at
      FROM 
        user_profiles
    `

    const result = await client.query(query)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching customers:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
})

// Get all payments
app.get("/api/payments", async (req, res) => {
  const client = await pool.connect()
  try {
    // Try a simplified query
    const query = `
      SELECT 
        p.payment_id, 
        p.event_id, 
        p.amount, 
        p.payment_date,
        e.name as event_name,
        up.firstname,
        up.surname,
        up.email
      FROM 
        payments p
      INNER JOIN
        events e ON p.event_id = e.event_id
      INNER JOIN
        user_profiles up ON e.user_id = up.user_id
    `

    const result = await client.query(query)
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
})

// Get user profile by ID
app.get("/api/user-profile/:userId", async (req, res) => {
  const { userId } = req.params
  const client = await pool.connect()
  try {
    const query = `
      SELECT 
        up.*, 
        f.faculty_name, 
        d.department_name 
      FROM 
        user_profiles up 
      LEFT JOIN 
        faculties f ON up.faculty_id = f.faculty_id 
      LEFT JOIN 
        departments d ON up.department_id = d.department_id 
      WHERE 
        up.user_id = $1
    `
    const result = await client.query(query, [userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
})

// Get events by user ID
app.get("/api/user-events/:userId", async (req, res) => {
  const { userId } = req.params
  const client = await pool.connect()
  try {
    const query = `
      SELECT * FROM events WHERE user_id = $1
    `
    const result = await client.query(query, [userId])
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching user events:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
})

// Get payment by event ID
app.get("/api/event-payment/:eventId", async (req, res) => {
  const { eventId } = req.params
  const client = await pool.connect()
  try {
    const query = `
      SELECT * FROM payments WHERE event_id = $1
    `
    const result = await client.query(query, [eventId])
    if (result.rows.length === 0) {
      return res.json({ amount: null })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching event payment:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    client.release()
  }
})

// API endpoint to fetch users without events
app.get("/api/users-without-events", async (req, res) => {
  try {
    const client = await pool.connect()
    const query = `
      SELECT up.* 
      FROM user_profiles up
      LEFT JOIN events e ON up.user_id = e.user_id
      WHERE e.user_id IS NULL
    `
    const result = await client.query(query)
    client.release()
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching users without events:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// API endpoint to fetch users with events
app.get("/api/users-with-events", async (req, res) => {
  try {
    const client = await pool.connect()
    const query = `
      SELECT up.*, e.name as event_name, e.startdate 
      FROM user_profiles up
      JOIN events e ON up.user_id = e.user_id
    `
    const result = await client.query(query)
    client.release()
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching users with events:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// API endpoint to fetch payments
app.get("/api/payments", async (req, res) => {
  try {
    const client = await pool.connect()
    const query = `
      SELECT p.*, e.name as event_name, up.firstname, up.surname, up.email
      FROM payments p
      JOIN events e ON p.event_id = e.event_id
      JOIN user_profiles up ON e.user_id = up.user_id
    `
    const result = await client.query(query)
    client.release()
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// API endpoint to fetch payments with user full names
app.get("/api/payments-with-user-names", async (req, res) => {
  try {
    const client = await pool.connect()
    const query = `
      SELECT 
        p.payment_id, 
        p.amount, 
        p.proof_of_payment,
        p.event_id,
        e.name as event_name,
        u.firstname,
        u.surname
      FROM 
        payments p
      JOIN 
        events e ON p.event_id = e.event_id
      JOIN 
        user_profiles u ON e.user_id = u.user_id
    `
    const result = await client.query(query)
    client.release()
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ error: "Failed to fetch payments" })
  }
})

//Leya Code
//----------------payments organizer start
// Get all events with pending ticket request counts
app.get("/api/organiser/events", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { userId } = req.user
    const query = `
      SELECT 
        e.event_id,
        e.name AS event_name,
        COALESCE(COUNT(tp.purchase_id), 0) AS request_count
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id
      WHERE e.user_id = $1
      GROUP BY e.event_id, e.name
      ORDER BY e.event_id DESC
    `
    const result = await client.query(query, [userId])
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching events:", error)
    res.status(500).json({
      error: "Failed to fetch events",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Get ticket purchase requests for a specific event
app.get("/api/organiser/events/:eventId/ticket-requests", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { eventId } = req.params
    const { userId } = req.user
    const { all } = req.query // Optional query param to fetch all statuses

    const query = `
      SELECT 
        tp.purchase_id,
        tp.event_id,
        tp.user_id,
        tp.number_of_tickets,
        tp.package,
        tp.amount,
        tp.proof_of_payment,
        tp.request_status,
        tp.delegate_details,
        e.name as event_name,
        up.firstname,
        up.surname,
        up.email
      FROM ticket_purchases tp
      JOIN events e ON tp.event_id = e.event_id
      JOIN user_profiles up ON tp.user_id = up.user_id
      WHERE e.event_id = $1 AND e.user_id = $2
      ORDER BY tp.purchase_id DESC
    `
    const result = await client.query(query, [eventId, userId])

    const requestsWithUrls = await Promise.all(
      result.rows.map(async (request) => {
        let proofOfPaymentUrl = null
        if (request.proof_of_payment) {
          const proofKey = request.proof_of_payment.startsWith("http")
            ? request.proof_of_payment.split("/").slice(3).join("/")
            : request.proof_of_payment
          try {
            proofOfPaymentUrl = await generatePresignedUrl(proofKey)
          } catch (e) {
            console.warn(`Failed to generate signed URL for proof of payment: ${proofKey}`, e)
          }
        }

        return {
          ...request,
          proof_of_payment_url: proofOfPaymentUrl,
          purchaser_name: `${request.firstname} ${request.surname}`.trim(),
        }
      }),
    )

    console.log("Fetched ticket requests for event:", eventId, "Count:", requestsWithUrls.length)
    res.json(requestsWithUrls)
  } catch (error) {
    console.error("Error fetching ticket requests:", error)
    res.status(500).json({
      error: "Failed to fetch ticket requests",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Update ticket purchase request status
app.put("/api/organiser/ticket-requests/:purchaseId/status", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { purchaseId } = req.params
    const { userId } = req.user
    const { request_status } = req.body

    if (!request_status || !["Approved", "Rejected", "pending"].includes(request_status)) {
      return res.status(400).json({ error: "Valid request status is required (Approved, Rejected, or pending)" })
    }

    await client.query("BEGIN")

    const query = `
      UPDATE ticket_purchases
      SET request_status = $1
      FROM events e
      WHERE ticket_purchases.purchase_id = $2 AND e.event_id = ticket_purchases.event_id AND e.user_id = $3
      RETURNING ticket_purchases.*
    `
    const result = await client.query(query, [request_status, purchaseId, userId])

    if (result.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Ticket purchase not found or access denied" })
    }

    await client.query("COMMIT")
    res.json({
      message: `Ticket purchase status updated to ${request_status}`,
      purchase: result.rows[0],
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error updating ticket request status:", error)
    res.status(500).json({
      error: "Failed to update ticket request status",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Get all ticket purchases for organiser's events
app.get("/api/organiser/ticket-purchases", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { userId } = req.user

    const query = `
      SELECT 
        tp.purchase_id,
        tp.event_id,
        tp.user_id,
        tp.number_of_tickets,
        tp.package,
        tp.amount,
        tp.proof_of_payment,
        tp.status,
        tp.delegate_details,
        e.name as event_name,
        up.firstname,
        up.surname,
        up.email
      FROM ticket_purchases tp
      JOIN events e ON tp.event_id = e.event_id
      JOIN user_profiles up ON tp.user_id = up.user_id
      WHERE e.user_id = $1 AND tp.request_status = 'Approved'
      ORDER BY tp.purchase_id DESC
    `
    const result = await client.query(query, [userId])

    const purchasesWithUrls = await Promise.all(
      result.rows.map(async (purchase) => {
        let proofOfPaymentUrl = null
        if (purchase.proof_of_payment) {
          const proofKey = purchase.proof_of_payment.split("/").slice(3).join("/")
          try {
            proofOfPaymentUrl = await generatePresignedUrl(proofKey)
          } catch (e) {
            console.warn(`Failed to generate signed URL for proof of payment: ${proofKey}`, e)
          }
        }

        return {
          ...purchase,
          proof_of_payment_url: proofOfPaymentUrl,
          purchaser_name: `${purchase.firstname} ${purchase.surname}`.trim(),
        }
      }),
    )

    console.log("Fetched ticket purchases for organiser:", userId, "Count:", purchasesWithUrls.length)
    res.json(purchasesWithUrls)
  } catch (error) {
    console.error("Error fetching ticket purchases:", error)
    res.status(500).json({
      error: "Failed to fetch ticket purchases",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Get single ticket purchase by ID
app.get("/api/organiser/ticket-purchases/:purchaseId", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { purchaseId } = req.params
    const { userId } = req.user

    const query = `
      SELECT 
        tp.purchase_id,
        tp.event_id,
        tp.user_id,
        tp.number_of_tickets,
        tp.package,
        tp.amount,
        tp.proof_of_payment,
        tp.status,
        tp.delegate_details,
        e.name as event_name,
        up.firstname,
        up.surname,
        up.email,
        up.cellnumber,
        up.institution,
        up.faculty_id,
        up.department_id,
        up.ieee_no,
        up.vat_no,
        f.faculty_name,
        d.department_name
      FROM ticket_purchases tp
      JOIN events e ON tp.event_id = e.event_id
      JOIN user_profiles up ON tp.user_id = up.user_id
      LEFT JOIN faculties f ON up.faculty_id = f.faculty_id
      LEFT JOIN departments d ON up.department_id = d.department_name
      WHERE tp.purchase_id = $1 AND e.user_id = $2
    `
    const result = await client.query(query, [purchaseId, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket purchase not found or access denied" })
    }

    const purchase = result.rows[0]
    let proofOfPaymentUrl = null
    if (purchase.proof_of_payment) {
      const proofKey = purchase.proof_of_payment.split("/").slice(3).join("/")
      try {
        proofOfPaymentUrl = await generatePresignedUrl(proofKey)
      } catch (e) {
        console.warn(`Failed to generate signed URL for proof of payment: ${proofKey}`, e)
      }
    }

    res.json({
      ...purchase,
      proof_of_payment_url: proofOfPaymentUrl,
      purchaser_name: `${purchase.firstname} ${purchase.surname}`.trim(),
    })
  } catch (error) {
    console.error("Error fetching ticket purchase:", error)
    res.status(500).json({
      error: "Failed to fetch ticket purchase",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Update ticket purchase status
app.put("/api/organiser/ticket-purchases/:purchaseId/status", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { purchaseId } = req.params
    const { userId } = req.user
    const { status } = req.body

    if (!status || !["Approved", "Rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required (Approved, Rejected, or pending)" })
    }

    await client.query("BEGIN")

    const query = `
      UPDATE ticket_purchases
      SET status = $1
      FROM events e
      WHERE ticket_purchases.purchase_id = $2 AND e.event_id = ticket_purchases.event_id AND e.user_id = $3 AND tp.request_status = 'Approved'
      RETURNING ticket_purchases.*
    `
    const result = await client.query(query, [status, purchaseId, userId])

    if (result.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Ticket purchase not found or access denied" })
    }

    await client.query("COMMIT")
    res.json({
      message: `Ticket purchase status updated to ${status}`,
      purchase: result.rows[0],
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error updating ticket purchase status:", error)
    res.status(500).json({
      error: "Failed to update ticket purchase status",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

//Analytics
app.get("/api/organiser/analytics", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { userId } = req.user

    // Query for Attendance
    const attendanceQuery = `
      SELECT 
        e.event_id,
        e.name AS event,
        COALESCE(SUM(tp.number_of_tickets), 0) AS attendance,
        e.capacity,
        TO_CHAR(e.startdate, 'Month') AS month,
        TO_CHAR(e.startdate, 'YYYY') AS year
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id AND tp.status = 'Approved'
      WHERE e.user_id = $1
      GROUP BY e.event_id, e.name, e.capacity, e.startdate
      ORDER BY e.startdate DESC;
    `

    // Query for Event Status
    const eventStatusQuery = `
      SELECT 
        e.event_id,
        e.name AS event,
        e.status,
        TO_CHAR(e.startdate, 'Month') AS month,
        TO_CHAR(e.startdate, 'YYYY') AS year
      FROM events e
      WHERE e.user_id = $1
      ORDER BY e.startdate DESC;
    `

    // Query for Tickets Sold per Event
    const ticketsSoldQuery = `
      SELECT 
        e.event_id,
        e.name AS event,
        COALESCE(SUM(tp.number_of_tickets), 0) AS tickets_sold,
        TO_CHAR(e.startdate, 'Month') AS month,
        TO_CHAR(e.startdate, 'YYYY') AS year
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id AND tp.request_status = 'Approved'
      WHERE e.user_id = $1
      GROUP BY e.event_id, e.name, e.startdate
      ORDER BY e.startdate DESC;
    `

    const [attendanceResult, eventStatusResult, ticketsSoldResult] = await Promise.all([
      client.query(attendanceQuery, [userId]),
      client.query(eventStatusQuery, [userId]),
      client.query(ticketsSoldQuery, [userId]),
    ])

    // Format data for frontend
    const analyticsData = {
      attendance: attendanceResult.rows.map((row) => ({
        event: row.event,
        attendance: Number.parseInt(row.attendance, 10) || 0,
        capacity: Number.parseInt(row.capacity, 10) || 0,
        month: row.month.trim(),
        year: row.year,
      })),
      eventStatus: eventStatusResult.rows.reduce((acc, row) => {
        const existing = acc.find((item) => item.month === row.month.trim() && item.year === row.year)
        if (existing) {
          existing[row.status.toLowerCase()] = (existing[row.status.toLowerCase()] || 0) + 1
        } else {
          acc.push({
            month: row.month.trim(),
            year: row.year,
            approved: row.status === "Approved" ? 1 : 0,
            rejected: row.status === "Rejected" ? 1 : 0,
            pending: row.status === "pending" ? 1 : 0,
          })
        }
        return acc
      }, []),
      ticketsSold: ticketsSoldResult.rows.map((row) => ({
        event: row.event,
        ticketsSold: Number.parseInt(row.tickets_sold, 10) || 0,
        month: row.month.trim(),
        year: row.year,
      })),
    }

    res.json(analyticsData)
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    res.status(500).json({
      error: "Failed to fetch analytics data",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Rehost an event by updating dates and setting status to pending
app.put("/api/events/:eventId/rehost", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { eventId } = req.params
    const { userId, role } = req.user
    const { startdate, enddate, deadline_date, packages, resetAttendees = false } = req.body // Added deadline_date

    console.log("Rehost request received:", {
      eventId,
      userId,
      startdate,
      enddate,
      deadline_date,
      packages,
      resetAttendees,
    })

    // Validate required fields
    if (!startdate || !enddate || !deadline_date || !packages || !Array.isArray(packages)) {
      return res
        .status(400)
        .json({ error: "Event start date, end date, registration deadline date, and packages array are required" })
    }

    // Validate each package
    if (packages.length === 0) {
      return res.status(400).json({ error: "At least one package is required" })
    }

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i]
      if (!pkg.startDate || !pkg.endDate) {
        return res.status(400).json({ error: `Package ${i + 1} is missing startDate or endDate` })
      }
    }

    // Convert input strings to Date objects for validation, assuming UTC
    const currentDate = new Date()
    const startDateObj = new Date(startdate + "T00:00:00Z")
    const endDateObj = new Date(enddate + "T00:00:00Z")
    const deadlineDateObj = new Date(deadline_date + "T00:00:00Z")

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()) || isNaN(deadlineDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid event or deadline date format" })
    }

    if (startDateObj < currentDate) {
      return res.status(400).json({ error: "Event start date must be today or in the future" })
    }

    if (endDateObj < startDateObj) {
      return res.status(400).json({ error: "Event end date must be on or after the event start date" })
    }

    if (deadlineDateObj >= startDateObj) {
      return res.status(400).json({ error: "Registration deadline must be before the event start date" })
    }

    // Validate package dates
    const oneWeekBeforeStart = new Date(startDateObj)
    oneWeekBeforeStart.setDate(startDateObj.getDate() - 7)

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i]
      const pkgStartDateObj = new Date(pkg.startDate + "T00:00:00Z")
      const pkgEndDateObj = new Date(pkg.endDate + "T00:00:00Z")

      if (isNaN(pkgStartDateObj.getTime()) || isNaN(pkgEndDateObj.getTime())) {
        return res.status(400).json({ error: `Invalid date format for package ${i + 1}` })
      }

      if (pkgStartDateObj < currentDate) {
        return res.status(400).json({ error: `Package ${i + 1} start date must be today or in the future` })
      }

      if (pkgEndDateObj < pkgStartDateObj) {
        return res.status(400).json({ error: `Package ${i + 1} end date must be on or after the package start date` })
      }

      if (pkgStartDateObj > oneWeekBeforeStart || pkgEndDateObj > oneWeekBeforeStart) {
        return res.status(400).json({
          error: `Package ${i + 1} start and end dates must be at least one week before the event start date (${startdate})`,
        })
      }
    }

    // Check if event exists and is eligible for rehosting
    const eventCheck = await client.query(
      `SELECT event_id, user_id, enddate AT TIME ZONE 'UTC' as enddate, name, attendees, status, packages 
       FROM events 
       WHERE event_id = $1 AND (user_id = $2 OR $3 = true) AND enddate < $4 AND status IN ('Approved', 'pending')`,
      [eventId, userId, role === "Admin", currentDate.toISOString()],
    )

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Event not found, not a past event, not in a rehostable status, or access denied",
      })
    }

    // Check for date conflicts with other events
    const conflictCheck = await client.query(
      `SELECT event_id, name, startdate AT TIME ZONE 'UTC' as startdate, enddate AT TIME ZONE 'UTC' as enddate 
       FROM events 
       WHERE user_id = $1 
       AND (
         (startdate <= $2 AND enddate >= $3) OR
         (startdate >= $3 AND startdate <= $2) OR
         (enddate >= $3 AND enddate <= $2)
       )
       AND event_id != $4 
       AND status IN ('Approved', 'pending')`,
      [userId, endDateObj.toISOString(), startDateObj.toISOString(), eventId],
    )

    if (conflictCheck.rows.length > 0) {
      const conflictDetails = conflictCheck.rows.map((row) => ({
        eventId: row.event_id,
        eventName: row.name,
        startDate: row.startdate.toISOString().split("T")[0],
        endDate: row.enddate.toISOString().split("T")[0],
        conflictingPeriod: {
          start: new Date(Math.max(new Date(row.startdate), startDateObj)).toISOString().split("T")[0],
          end: new Date(Math.min(new Date(row.enddate), endDateObj)).toISOString().split("T")[0],
        },
      }))

      return res.status(400).json({
        error: "The requested event dates conflict with one or more existing events",
        conflicts: conflictDetails,
      })
    }

    // Update packages by merging new dates with existing package data
    const existingPackages = eventCheck.rows[0].packages || []
    if (existingPackages.length !== packages.length) {
      return res.status(400).json({
        error: `Number of packages provided (${packages.length}) does not match existing packages (${existingPackages.length})`,
      })
    }

    const updatedPackages = existingPackages.map((pkg, index) => {
      try {
        const parsedPkg = JSON.parse(pkg)
        return JSON.stringify({
          ...parsedPkg,
          startDate: packages[index].startDate + "T00:00:00Z",
          endDate: packages[index].endDate + "T00:00:00Z",
        })
      } catch (e) {
        console.warn(`Failed to parse package: ${pkg}`, e)
        return pkg // Return original package if parsing fails
      }
    })

    await client.query("BEGIN")

    // Handle attendees: preserve existing unless resetAttendees is true
    let validatedAttendees = null // Use null to avoid updating attendees unless explicitly needed
    if (resetAttendees) {
      validatedAttendees = "{}" // Reset to empty array
    } else {
      // Preserve existing attendees without filtering
      validatedAttendees = eventCheck.rows[0].attendees || "{}" // Keep original attendees as-is
    }

    const updateQuery = `
      UPDATE events 
      SET startdate = $1,
          enddate = $2,
          deadlinedate = $3, -- Added deadlinedate
          packages = $4,
          status = 'pending',
          attendees = COALESCE($5, attendees), -- Only update if validatedAttendees is not null
          admin_comment = NULL
      WHERE event_id = $6
      RETURNING *;
    `

    const updateValues = [
      startDateObj.toISOString(),
      endDateObj.toISOString(),
      deadlineDateObj.toISOString().split("T")[0], // Store as date-only
      updatedPackages,
      validatedAttendees,
      eventId,
    ]
    const result = await client.query(updateQuery, updateValues)

    if (result.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Event not found after verification" })
    }

    await client.query("COMMIT")

    const updatedEvent = result.rows[0]

    // Generate presigned URL for response
    let coverImageUrl = "/default-event-image.jpg"
    if (updatedEvent.coverimage) {
      const coverKey = updatedEvent.coverimage.split("/").slice(3).join("/")
      try {
        coverImageUrl = await generatePresignedUrl(coverKey)
      } catch (e) {
        console.warn("Failed to generate signed URL for cover image:", e)
      }
    }

    const parsedTabs = updatedEvent.tabs
      ? updatedEvent.tabs.map((tab) => {
          try {
            return JSON.parse(tab)
          } catch (e) {
            console.warn(`Failed to parse tab: ${tab}`, e)
            return {}
          }
        })
      : []

    const parsedPackages = updatedEvent.packages
      ? updatedEvent.packages.map((pkg) => {
          try {
            return JSON.parse(pkg)
          } catch (e) {
            console.warn(`Failed to parse package: ${pkg}`, e)
            return {}
          }
        })
      : []

    console.log("Event rehosted successfully:", updatedEvent.event_id)

    res.json({
      message: "Event rehost request submitted successfully, pending admin approval",
      event: {
        ...updatedEvent,
        coverimage: coverImageUrl,
        tabs: parsedTabs,
        packages: parsedPackages,
      },
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error rehosting event:", error)
    res.status(500).json({
      error: "Failed to rehost event",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Get past events for the logged-in user
app.get("/api/events-past", authenticateToken, async (req, res) => {
  console.log("Received request to /api/events-past", {
    headers: req.headers,
    user: req.user,
  })

  const client = await pool.connect()
  try {
    const { userId, role } = req.user

    // Get current date for comparison
    const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
    console.log("Current date:", currentDate)

    // Query to fetch events with enddate < currentDate
    const query = `
      SELECT 
        event_id, name, description, terms_and_conditions, location,
        startdate, enddate, time, endtime, duration, deadlinetime,
        deadlinedate, type, capacity, attendees, contactnum, email,
        coverimage, tabs, packages, status, user_id
      FROM events
      WHERE user_id = $1 
        AND enddate < $2::date
        AND status = 'Approved'
      ORDER BY enddate DESC, endtime DESC
    `

    console.log("Executing query with params:", [userId, currentDate])

    const result = await client.query(query, [userId, currentDate])

    console.log(`Found ${result.rows.length} past events`)

    // Log each event for debugging
    result.rows.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, {
        id: event.event_id,
        name: event.name,
        startdate: event.startdate,
        enddate: event.enddate,
        status: event.status,
      })
    })

    const eventsWithUrls = await Promise.all(
      result.rows.map(async (event) => {
        let coverImageUrl = "/default-profile-picture.jpg"
        if (event.coverimage) {
          const coverKey = event.coverimage.split("/").slice(3).join("/")
          try {
            coverImageUrl = await generatePresignedUrl(coverKey)
          } catch (e) {
            console.warn("Failed to generate signed URL for cover image:", e)
          }
        }

        const parsedTabs = event.tabs
          ? event.tabs.map((tab) => {
              try {
                return JSON.parse(tab)
              } catch (e) {
                console.warn(`Failed to parse tab: ${tab}`, e)
                return {}
              }
            })
          : []

        const parsedPackages = event.packages
          ? event.packages.map((pkg) => {
              try {
                return JSON.parse(pkg)
              } catch (e) {
                console.warn(`Failed to parse package: ${pkg}`, e)
                return {}
              }
            })
          : []

        // Ensure attendees is an array
        const attendees = Array.isArray(event.attendees)
          ? event.attendees
          : typeof event.attendees === "string" && event.attendees.includes(",")
            ? event.attendees.split(",").map((item) => item.trim())
            : typeof event.attendees === "string"
              ? [event.attendees]
              : []

        return {
          ...event,
          coverimage: coverImageUrl,
          tabs: parsedTabs,
          packages: parsedPackages,
          attendees: attendees,
        }
      }),
    )

    console.log(`Returning ${eventsWithUrls.length} processed past events`)
    res.json(eventsWithUrls)
  } catch (error) {
    console.error("Error fetching past events:", {
      message: error.message,
      stack: error.stack,
      userId: req.user.userId,
    })
    res.status(500).json({
      error: "Failed to fetch past events",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

app.get("/api/events/:eventid", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const eventId = req.params.eventid
    const query = `
      SELECT 
        event_id,
        name,
        description,
        terms_and_conditions,
        location,
        TO_CHAR(startdate, 'YYYY-MM-DD') as start_date,
        TO_CHAR(enddate, 'YYYY-MM-DD') as end_date,
        TO_CHAR(deadlinedate, 'YYYY-MM-DD') as registration_deadline_date,
        time as start_time,
        endtime as end_time,
        deadlinetime as registration_deadline_time,
        type as event_type,
        capacity,
        attendees,
        contactnum,
        email,
        coverimage,
        tabs,
        packages,
        status,
        user_id
      FROM events
      WHERE event_id = $1
        AND user_id = $2
    `
    const result = await client.query(query, [eventId, req.user.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" })
    }

    const event = result.rows[0]
    let coverImageUrl = "/default-profile-picture.jpg"
    if (event.coverimage) {
      const coverKey = event.coverimage.split("/").slice(3).join("/")
      try {
        coverImageUrl = await generatePresignedUrl(coverKey)
      } catch (e) {
        console.warn("Failed to generate signed URL for cover image:", e)
      }
    }

    const parsedTabs = event.tabs
      ? event.tabs.map((tab) => {
          try {
            return JSON.parse(tab)
          } catch (e) {
            console.warn(`Failed to parse tab: ${tab}`, e)
            return {}
          }
        })
      : []

    const parsedPackages = event.packages
      ? event.packages.map((pkg) => {
          try {
            const parsedPkg = JSON.parse(pkg)
            // Ensure package dates are also formatted
            return {
              ...parsedPkg,
              startDate: parsedPkg.startDate ? formatDate(parsedPkg.startDate) : "N/A",
              endDate: parsedPkg.endDate ? formatDate(parsedPkg.endDate) : "N/A",
            }
          } catch (e) {
            console.warn(`Failed to parse package: ${pkg}`, e)
            return {}
          }
        })
      : []

    const responseEvent = {
      ...event,
      coverimage: coverImageUrl,
      tabs: parsedTabs,
      packages: parsedPackages,
      attendees: Array.isArray(event.attendees)
        ? event.attendees
        : typeof event.attendees === "string" && event.attendees.includes(",")
          ? event.attendees.split(",").map((item) => item.trim())
          : typeof event.attendees === "string"
            ? [event.attendees]
            : [],
    }

    res.json(responseEvent)
  } catch (error) {
    console.error("Error fetching event:", error)
    res.status(500).json({ error: "Failed to fetch event", details: error.message })
  } finally {
    client.release()
  }
})

// Helper function to format dates in backend
function formatDate(dateString) {
  if (!dateString) return "N/A"
  try {
    const [year, month, day] = dateString.split("-")
    if (!year || !month || !day || year.length !== 4) {
      throw new Error("Invalid date format")
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  } catch (error) {
    console.error("Backend date formatting error:", error, "Input:", dateString)
    return "N/A"
  }
}

// API endpoint for saving ticket purchases
app.post("/api/ticket-purchases", authenticateToken, async (req, res) => {
  try {
    // Extract data from the request body
    const { event_id, user_id, number_of_tickets, package: packageDetails, amount, delegate_details } = req.body

    // Validate required fields
    if (!event_id || !user_id || !number_of_tickets || !packageDetails || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields for ticket purchase" })
    }

    console.log("Received ticket purchase request:", {
      event_id,
      user_id,
      number_of_tickets,
      packageDetails,
      amount,
      delegate_details,
    })

    // For PostgreSQL JSONB column, we need to ensure delegate_details is properly formatted
    let delegateDetailsForDB

    try {
      if (!delegate_details) {
        // If no delegate details provided, use empty object
        delegateDetailsForDB = "{}"
      } else if (typeof delegate_details === "object") {
        // Convert object to JSON string for PostgreSQL JSONB
        delegateDetailsForDB = delegate_details
      } else if (typeof delegate_details === "string") {
        // If it's already a string, ensure it's valid JSON
        try {
          // Try to parse it to validate JSON format
          delegateDetailsForDB = JSON.parse(delegate_details)
        } catch (e) {
          // Not valid JSON, create a simple object with the string
          delegateDetailsForDB = { value: delegate_details }
        }
      } else {
        // Fallback for any other type
        delegateDetailsForDB = { value: String(delegate_details) }
      }

      console.log("Delegate details formatted for DB:", delegateDetailsForDB)
    } catch (error) {
      console.error("Error formatting delegate details:", error)
      return res.status(400).json({ error: "Invalid delegate details format" })
    }

    // Insert ticket purchase into database with default status 'pending'
    const query = `
    INSERT INTO ticket_purchases (event_id, user_id, number_of_tickets, package, amount, delegate_details, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `

    // Make sure package is a string - PostgreSQL will store as character varying
    const packageForDB = typeof packageDetails === "object" ? JSON.stringify(packageDetails) : String(packageDetails)

    // Format amount as numeric for PostgreSQL
    const numericAmount =
      typeof amount === "string" ? Number.parseFloat(amount.replace(/[^0-9.-]+/g, "")) : Number.parseFloat(amount)

    if (isNaN(numericAmount)) {
      return res.status(400).json({ error: "Invalid amount format" })
    }

    const values = [
      Number.parseInt(event_id),
      Number.parseInt(user_id),
      Number.parseInt(number_of_tickets),
      packageForDB,
      numericAmount,
      delegateDetailsForDB, // This is properly formatted for JSONB now
      "pending", // Default status
    ]

    // Log values in a controlled way to avoid timing information being included
    console.log("Executing SQL with values:", [
      Number.parseInt(event_id),
      Number.parseInt(user_id),
      Number.parseInt(number_of_tickets),
      packageForDB,
      numericAmount,
      "(delegate_details object)",
      "pending",
    ])

    try {
      const result = await pool.query(query, values)

      console.log("Ticket purchase created successfully:", result.rows[0])

      // Return success response with the created ticket purchase details
      res.status(201).json({
        message: "Ticket purchase created successfully",
        purchase: result.rows[0],
      })
    } catch (dbError) {
      console.error("Database error during ticket purchase insertion:", dbError)
      res.status(500).json({
        error: "Database error during ticket purchase",
        details: dbError.message,
        hint: dbError.hint,
        code: dbError.code,
      })
    }
  } catch (error) {
    console.error("Error creating ticket purchase. Full error:", error)
    console.error("Error stack trace:", error.stack)
    console.error("Request body received:", req.body)
    res.status(500).json({
      error: "Failed to create ticket purchase: " + error.message,
      details: error.detail || "No additional details available",
    })
  }
})

// API endpoint for updating ticket status (for payment processing)
app.post("/api/update-ticket-status", authenticateToken, async (req, res) => {
  try {
    // Extract data from the request body
    const { user_id, event_id, status } = req.body

    // Validate required fields
    if (!user_id || !event_id || !status) {
      return res.status(400).json({ error: "Missing required fields for updating ticket status" })
    }

    console.log("Updating ticket status:", { user_id, event_id, status })

    // Update ticket status in database
    const query = `
      UPDATE ticket_purchases
      SET status = $1
      WHERE user_id = $2 AND event_id = $3 AND status = 'pending'
      RETURNING purchase_id
    `

    const values = [status, user_id, event_id]

    const result = await pool.query(query, values)

    // Check if any rows were affected
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No pending tickets found for this user and event" })
    }

    console.log("Ticket status updated successfully:", result.rows)

    // Return success response with the updated ticket IDs
    res.status(200).json({
      message: `Ticket status updated to '${status}' successfully`,
      ticketIds: result.rows.map((row) => row.purchase_id),
    })
  } catch (error) {
    console.error("Error updating ticket status:", error)
    res.status(500).json({ error: "Failed to update ticket status: " + error.message })
  }
})

// Get user's approved ticket purchases with event details
app.get("/api/user-ticket-purchases/:userId", authenticateToken, async (req, res) => {
  const client = await pool.connect()
  try {
    const { userId } = req.params
    const requestingUserId = req.user.userId

    // Ensure user can only access their own ticket purchases (unless admin)
    if (requestingUserId !== Number.parseInt(userId) && req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied. You can only view your own ticket purchases." })
    }

    console.log(`Fetching approved ticket purchases for user ID: ${userId}`)

    const query = `
      SELECT 
        tp.purchase_id,
        tp.event_id,
        tp.user_id,
        tp.number_of_tickets,
        tp.package,
        tp.amount,
        tp.status as purchase_status,
        tp.delegate_details,
        e.name as event_name,
        e.location,
        e.startdate::text as event_date,
        e.time::text as event_time,
        e.description,
        e.capacity,
        e.type as event_type,
        e.coverimage,
        up.firstname,
        up.surname,
        up.email
      FROM ticket_purchases tp
      JOIN events e ON tp.event_id = e.event_id
      JOIN user_profiles up ON tp.user_id = e.user_id
      WHERE tp.user_id = $1 AND tp.status = 'Approved'
      ORDER BY e.startdate DESC
    `

    const result = await client.query(query, [userId])

    console.log(`Found ${result.rows.length} approved ticket purchases for user ${userId}`)

    // Generate presigned URLs for event images and add additional processing
    const purchasesWithUrls = await Promise.all(
      result.rows.map(async (purchase) => {
        let file_url = "/default-event-image.png"

        if (purchase.coverimage && purchase.coverimage.trim() !== "") {
          try {
            const coverKey = purchase.coverimage.startsWith("https://")
              ? purchase.coverimage.split("/").slice(3).join("/")
              : purchase.coverimage
            const presignedUrl = await generatePresignedUrl(coverKey)
            if (presignedUrl) {
              file_url = presignedUrl
            }
          } catch (err) {
            console.error(`Error generating presigned URL for event ${purchase.event_id}:`, err)
          }
        }

        // Parse package information if it's a JSON string
        let packageInfo = "Standard"
        try {
          if (typeof purchase.package === "string" && purchase.package.startsWith("{")) {
            const parsedPackage = JSON.parse(purchase.package)
            packageInfo = parsedPackage.selectType || parsedPackage.packageType || "Standard"
          } else {
            packageInfo = purchase.package || "Standard"
          }
        } catch (e) {
          console.warn("Could not parse package info:", purchase.package)
          packageInfo = purchase.package || "Standard"
        }

        return {
          ...purchase,
          file_url,
          package_type: packageInfo,
          purchaser_name: `${purchase.firstname} ${purchase.surname}`.trim(),
        }
      }),
    )

    res.json(purchasesWithUrls)
  } catch (error) {
    console.error("Error fetching user ticket purchases:", error)
    res.status(500).json({
      error: "Failed to fetch ticket purchases",
      details: error.message,
    })
  } finally {
    client.release()
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
