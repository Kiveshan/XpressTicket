require('dotenv').config();
console.log('JWT_SECRET from .env:', process.env.JWT_SECRET ? 'Set' : 'Not set');

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');

const app = express();
const port = 5000;



// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Validate required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ems2.0',
  password: '123456',
  port: 5433,
})


// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('✅ Connected to ExpressTicket database');
  initializeLookupTables();
  release();
});

// Ensure faculties/departments tables and seed data
async function initializeLookupTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create faculties table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.faculties (
        faculty_id character varying NOT NULL,
        faculty_name character varying NOT NULL,
        CONSTRAINT faculties_pkey PRIMARY KEY (faculty_id)
      );
    `);

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
    `);

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
    `);

    // Create events table with user_id and status
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.events (
        event_id SERIAL NOT NULL,
        name character varying NOT NULL,
        location character varying NOT NULL,
        startdate date NOT NULL,
        enddate date NOT NULL,
        time time without time zone NOT NULL,
        endtime time without time zone,
        duration character varying NOT NULL,
        deadlinetime time without time zone NOT NULL,
        deadlinedate date NOT NULL,
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
    `);


    // Add this inside initializeLookupTables, after the payments table creation
    await client.query(`
  CREATE TABLE IF NOT EXISTS public.ticket_purchases (
    purchase_id SERIAL NOT NULL,
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    number_of_tickets integer NOT NULL,
    amount real NOT NULL,
    purchase_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ticket_purchases_pkey PRIMARY KEY (purchase_id),
    CONSTRAINT ticket_purchases_event_id_fkey FOREIGN KEY (event_id)
      REFERENCES public.events (event_id) ON DELETE CASCADE,
    CONSTRAINT ticket_purchases_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.user_profiles (user_id) ON DELETE NO ACTION
  );
`);





   
    // Seed sample data if no faculties present
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM faculties');
    if (rows[0].count === 0) {
      console.log('🔰 Seeding default faculties & departments');
      const faculties = [
        { id: 'ENG', name: 'Engineering' },
        { id: 'SCI', name: 'Sciences' },
        { id: 'HUM', name: 'Humanities' },
        { id: 'BUS', name: 'Business' },
        { id: 'HSC', name: 'Health Sciences' },
        { id: 'FAI', name: 'Faculty of Artificial Intelligence' }
      ];

      for (const faculty of faculties) {
        await client.query(
          'INSERT INTO faculties (faculty_id, faculty_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [faculty.id, faculty.name]
        );
      }

      const deptSeed = {
        'ENG': [
          { id: 'CS', name: 'Computer Science' },
          { id: 'EE', name: 'Electrical Engineering' },
          { id: 'ME', name: 'Mechanical Engineering' }
        ],
        'SCI': [
          { id: 'BIO', name: 'Biology' },
          { id: 'CHEM', name: 'Chemistry' },
          { id: 'PHY', name: 'Physics' }
        ],
        'HUM': [
          { id: 'HIST', name: 'History' },
          { id: 'PHIL', name: 'Philosophy' }
        ],
        'BUS': [
          { id: 'MKT', name: 'Marketing' },
          { id: 'ACC', name: 'Accounting' }
        ],
        'HSC': [
          { id: 'NUR', name: 'Nursing' },
          { id: 'PT', name: 'Physiotherapy' }
        ],
        'FAI': [
          { id: 'FIM', name: 'Faculty Intelligence Management' }
        ]
      };

      for (const [facultyId, departments] of Object.entries(deptSeed)) {
        for (const dept of departments) {
          await client.query(
            'INSERT INTO departments (department_id, department_name, faculty_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [dept.id, dept.name, facultyId]
          );
        }
      }
      console.log('✅ Lookup data seeded');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing lookup tables:', err);
  } finally {
    client.release();
  }
}

// AWS S3 Configuration
const s3Client = new S3Client({
  region: 'af-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Auth header:', authHeader);
  console.log('Token:', token ? token.substring(0, 10) + '...' : 'No token');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('Token verified, user:', user);
    req.user = user;
    next();
  });
};

// Admin middleware
const authenticateAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Helper function to split full name into first and last name
const splitName = (fullName) => {
  if (!fullName) return { firstName: '', lastName: '' };
  const names = fullName.trim().split(/\s+/);
  const lastName = names.pop() || '';
  const firstName = names.join(' ');
  return { firstName, lastName };
};

// Helper function to log incoming requests
const logRequest = (req) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  console.log('======================\n');
};

// Helper function to generate presigned URL
async function generatePresignedUrl(key) {
  if (!key) return null;
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return null;
  }
}

// User registration
app.post('/api/register', async (req, res) => {
  logRequest(req);
  console.log('Starting registration process...');

  const client = await pool.connect();
  try {
    console.log('Received registration data:', req.body);

    const { name, email, password, phone, institution, faculty_id, department_id, ieee_number, vat_number } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const { firstName, lastName } = splitName(name);
    console.log('Processed name:', { firstName, lastName });

    // Check if user exists
    console.log('Checking if user exists...');
    const userExists = await client.query(
      'SELECT user_id FROM user_profiles WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    console.log('Transaction started');

    try {
      // Get the next user_id
      const userIdResult = await client.query('SELECT COALESCE(MAX(user_id), 0) + 1 AS next_user_id FROM user_profiles');
      const nextUserId = userIdResult.rows[0].next_user_id;
      console.log('Next user_id:', nextUserId);

      // Insert into user_profiles table
      const userQuery = `
        INSERT INTO user_profiles (user_id, firstname, surname, email, password, role, cellnumber, institution, faculty_id, department_id, ieee_no, vat_no)
        VALUES ($1, $2, $3, $4, $5, 'user', $6, $7, $8, $9, $10, $11)
        RETURNING user_id, email, role;
      `;

      const userResult = await client.query(userQuery, [nextUserId, firstName, lastName, email, hashedPassword, phone, institution, faculty_id, department_id, ieee_number, vat_number]);
      const user = userResult.rows[0];
      console.log('Generated user_id:', user.user_id);
      console.log('User created:', user);

      await client.query('COMMIT');
      console.log('Transaction committed');

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          name: `${firstName} ${lastName}`.trim()
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token, message: 'Registration successful' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred' });
  } finally {
    client.release();
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email in user_profiles table
    const result = await pool.query(
      `SELECT user_id, email, password, role, 
              firstname, surname, cellnumber, institution,
              faculty_id, department_id, ieee_no, vat_no
       FROM user_profiles
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is an admin based on role field
    const isAdmin = user.role === 'Admin';

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role || 'user',
        name: `${user.firstname || ''} ${user.surname || ''}`.trim() || user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without sensitive information
    const userResponse = {
      id: user.user_id,
      email: user.email,
      role: user.role,
      isAdmin: isAdmin,
      firstname: user.firstname,
      surname: user.surname,
      name: `${user.firstname || ''} ${user.surname || ''}`.trim(),
      cellnumber: user.cellnumber,
      institution: user.institution,
      faculty_id: user.faculty_id,
      department_id: user.department_id,
      ieee_no: user.ieee_no,
      vat_no: user.vat_no
    };

    console.log(`User ${user.email} logged in with role: ${user.role}, isAdmin: ${isAdmin}`);

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

async function generatePresignedUrl(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error(`Error generating presigned URL for key ${key}:`, error);
    return null;
  }
}


app.get('/api/analytics/profit-vs-tickets', authenticateToken, async (req, res) => {
  console.log('📌 Hit /api/analytics/profit-vs-tickets');
  const client = await pool.connect();

  try {
    const { userId } = req.user;
    const { month, year } = req.query;

    let query = `
      SELECT 
        e.event_id,
        e.name AS event,
        COALESCE(SUM(tp.amount), 0) AS ticketsSold,
        COALESCE(p.amount, 0) AS hostingCost,
        COALESCE(SUM(tp.amount) - p.amount, 0) AS profit,
        TO_CHAR(e.startdate, 'Month') AS month,
        EXTRACT(YEAR FROM e.startdate)::text AS year
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id
      LEFT JOIN payments p ON e.event_id = p.event_id
      WHERE e.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    if (month && month !== 'All') {
      query += ` AND TO_CHAR(e.startdate, 'Month') ILIKE $${paramIndex}`;
      queryParams.push(`${month}%`);
      paramIndex++;
    }

    if (year && year !== 'All') {
      query += ` AND EXTRACT(YEAR FROM e.startdate)::text = $${paramIndex}`;
      queryParams.push(year);
      paramIndex++;
    }

    query += `
      GROUP BY e.event_id, e.name, p.amount, e.startdate
      ORDER BY e.startdate DESC
    `;

    console.log('🔍 Executing query:', query);
    console.log('🧾 Params:', queryParams);

    const result = await client.query(query, queryParams);

    const data = result.rows.map(row => ({
      event: row.event,
      profit: parseFloat(row.profit) || 0,
      ticketsSold: parseFloat(row.ticketsSold) || 0,
      month: row.month.trim(),
      year: row.year
    }));

    res.json(data);
  } catch (error) {
    console.error('❌ Error in profit-vs-tickets:', error);
    res.status(500).json({
      error: 'Failed to fetch profit analytics',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Analytics: Attendance vs Capacity
app.get('/api/analytics/attendance', authenticateToken, async (req, res) => {
  console.log('📌 Hit /api/analytics/attendance');
  const client = await pool.connect();

  try {
    const { userId } = req.user;
    const { month, year } = req.query;

    let query = `
      SELECT 
        e.event_id,
        e.name AS event,
        e.capacity,
        COALESCE(SUM(tp.number_of_tickets), 0) AS attendance,
        TO_CHAR(e.startdate, 'Month') AS month,
        EXTRACT(YEAR FROM e.startdate)::text AS year
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id
      WHERE e.user_id = $1
    `;

    const queryParams = [userId];
    let paramIndex = 2;

    if (month && month !== 'All') {
      query += ` AND TO_CHAR(e.startdate, 'Month') ILIKE $${paramIndex}`;
      queryParams.push(`${month}%`);
      paramIndex++;
    }

    if (year && year !== 'All') {
      query += ` AND EXTRACT(YEAR FROM e.startdate)::text = $${paramIndex}`;
      queryParams.push(year);
      paramIndex++;
    }

    query += `
      GROUP BY e.event_id, e.name, e.capacity, e.startdate
      ORDER BY e.startdate DESC
    `;

    console.log('🔍 Executing query:', query);
    console.log('🧾 Params:', queryParams);

    const result = await client.query(query, queryParams);

    const data = result.rows.map(row => ({
      event: row.event,
      attendance: parseInt(row.attendance) || 0,
      capacity: parseInt(row.capacity) || 0,
      month: row.month.trim(),
      year: row.year
    }));

    res.json(data);
  } catch (error) {
    console.error('❌ Error in attendance analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance analytics',
      details: error.message
    });
  } finally {
    client.release();
  }
});




app.get('/api/events', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, role } = req.user;

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
    `;

    let queryParams = [];

    if (role !== 'Admin') {
      query += ` WHERE e.user_id = $1`;
      queryParams.push(userId);
    }

    query += ` ORDER BY e.startdate DESC, e.time DESC`;

    console.log('Fetching events for userId:', userId, 'role:', role);
    console.log('Query:', query);
    console.log('Params:', queryParams);

    const result = await client.query(query, queryParams);

    const eventsWithPresignedUrls = await Promise.all(result.rows.map(async (event) => {
      let coverImageUrl = '/default-profile-picture.jpg';

      if (event.coverimage) {
        const coverKey = event.coverimage.split('/').slice(3).join('/');
        try {
          coverImageUrl = await generatePresignedUrl(coverKey);
        } catch (e) {
          console.warn('Failed to generate signed URL for cover image:', e);
        }
      }

      const parsedTabs = event.tabs ? event.tabs.map(tab => {
        try {
          return JSON.parse(tab);
        } catch (e) {
          console.warn(`Failed to parse tab: ${tab}`, e);
          return {};
        }
      }) : [];

      const parsedPackages = event.packages ? event.packages.map(pkg => {
        try {
          return JSON.parse(pkg);
        } catch (e) {
          console.warn(`Failed to parse package: ${pkg}`, e);
          return {};
        }
      }) : [];

      return {
        ...event,
        coverimage: coverImageUrl,
        tabs: parsedTabs,
        packages: parsedPackages
      };
    }));

    console.log('Events fetched:', eventsWithPresignedUrls);
    res.json(eventsWithPresignedUrls);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      details: error.message
    });
  } finally {
    client.release();
  }
});



app.post('/api/events', authenticateToken, upload.fields([
  { name: 'cover_image', maxCount: 1 },
]), async (req, res) => {
  console.log('Received /api/events request');
  console.log('Files received:', req.files);
  console.log('Body:', req.body);

  const client = await pool.connect();
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
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name || name.trim() === '') missingFields.push('name');
    if (!location || location.trim() === '') missingFields.push('location');
    if (!startdate || startdate.trim() === '') missingFields.push('startdate');
    if (!enddate || enddate.trim() === '') missingFields.push('enddate');
    if (!start_time || start_time.trim() === '') missingFields.push('time');
    if (!duration || duration.trim() === '') missingFields.push('duration');
    if (!deadlinedate || deadlinedate.trim() === '') missingFields.push('deadlinedate');
    if (!deadlinetime || deadlinetime.trim() === '') missingFields.push('deadlinetime');
    if (!type || type.trim() === '') missingFields.push('type');
    if (!capacity || capacity.trim() === '') missingFields.push('capacity');
    if (!attendees || attendees.trim() === '') missingFields.push('attendees');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        details: `The following fields are missing or empty: ${missingFields.join(', ')}`,
      });
    }

    // Validate cover image
    if (!req.files || !req.files['cover_image'] || !req.files['cover_image'][0]) {
      console.error('No cover image file received');
      return res.status(400).json({ error: 'Cover image is required' });
    }
    const coverImageFile = req.files['cover_image'][0];
    console.log('Cover image file:', {
      originalname: coverImageFile.originalname,
      mimetype: coverImageFile.mimetype,
      size: coverImageFile.size,
      bufferLength: coverImageFile.buffer ? coverImageFile.buffer.length : 'undefined',
    });
    if (!['image/jpeg', 'image/png'].includes(coverImageFile.mimetype)) {
      console.error('Invalid cover image type:', coverImageFile.mimetype);
      return res.status(400).json({ error: 'Cover image must be JPEG or PNG' });
    }

    let parsedAttendees = [];
    let parsedTabs = [];
    let parsedPackages = [];
    try {
      parsedAttendees = attendees.startsWith('{') ? attendees.slice(1, -1).split(',').filter(item => item.trim()) : JSON.parse(attendees || '[]');
      parsedTabs = JSON.parse(tabs || '[]').map(tab => JSON.stringify(tab));
      parsedPackages = JSON.parse(packages || '[]').map(pkg => JSON.stringify(pkg));
    } catch (e) {
      console.error('JSON parsing error:', e.message);
      return res.status(400).json({ error: 'Invalid JSON format for attendees, tabs, or packages', details: e.message });
    }

    await client.query('BEGIN');

    // Upload cover image to S3
    let coverImageUrl;
    let coverImageKey;
    try {
      const file = req.files['cover_image'][0];
      const sanitizedFileName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      coverImageKey = `cover_images/${Date.now()}_${sanitizedFileName}`;

      console.log('Uploading cover image to S3:', {
        bucket: process.env.S3_BUCKET_NAME,
        key: coverImageKey,
        contentType: file.mimetype,
        bufferLength: file.buffer ? file.buffer.length : 'undefined',
      });

      const coverImageCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: coverImageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(coverImageCommand);
      coverImageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.af-south-1.amazonaws.com/${coverImageKey}`;
      console.log('Cover image uploaded successfully:', coverImageUrl);

      // Verify coverImageUrl
      if (!coverImageUrl || typeof coverImageUrl !== 'string' || !coverImageUrl.startsWith('https://')) {
        throw new Error('Invalid cover image URL after upload');
      }
    } catch (error) {
      console.error('Failed to upload cover image to S3:', error);
      throw new Error(`Cover image upload failed: ${error.message}`);
    }

    // Insert event without payment-related fields
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
      parseInt(capacity, 10),
      `{${parsedAttendees.join(',')}}`,
      null, // contactnum
      null, // email
      coverImageUrl,
      parsedTabs,
      parsedPackages,
      description || null,
      terms_and_conditions || null,
      end_time || null,
      req.user.userId,
      'pending',
    ];

    console.log('Insert query parameters:', queryParams.map((param, idx) => ({
      index: idx + 1,
      value: param,
      type: typeof param,
    })));

    const eventResult = await client.query(
      `INSERT INTO events (
         name, location, startdate, enddate, time, duration, deadlinedate, deadlinetime,
         type, capacity, attendees, contactnum, email, coverimage, tabs, packages,
         description, terms_and_conditions, endtime, user_id, status
      ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING event_id`,
      queryParams
    );

    const event_id = eventResult.rows[0].event_id;
    console.log('Event created with ID:', event_id);

    await client.query('COMMIT');
    console.log('Transaction committed');

    const finalEvent = await client.query(
      `SELECT * FROM events WHERE event_id = $1`,
      [event_id]
    );

    // Generate presigned URL for response
    const finalCoverImageUrl = coverImageKey ? await generatePresignedUrl(coverImageKey) : coverImageUrl;

    console.log('Event created:', finalEvent.rows[0]);
    res.status(200).json({
      message: 'Event created successfully',
      coverImageUrl: finalCoverImageUrl,
      event: finalEvent.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  } finally {
    client.release();
  }
});



//Get all the events for the logged in user 
// Get all events for the logged-in user
// Get all




// Get single event by ID
app.put('/api/events/:eventId', authenticateToken, upload.fields([
  { name: 'cover_image', maxCount: 1 },
]), async (req, res) => {
  const client = await pool.connect();
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;
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
      // Remove payment_amount and payment_type from destructuring
    } = req.body;

    // Verify the user owns the event and the event is in 'Request Edit' or 'pending' status
    const ownershipCheck = await client.query(
      `SELECT event_id, status FROM events 
       WHERE event_id = $1 AND user_id = $2 
       AND (status = 'Request Edit' OR status = 'pending' OR $3 = true)`,
      [eventId, userId, req.user.role === 'Admin']
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'Not authorized to update this event or event not in editable status'
      });
    }

    await client.query('BEGIN');

    // Parse attendees, tabs, and packages
    let parsedAttendees = attendees;
    let parsedTabs = tabs;
    let parsedPackages = packages;

    try {
      parsedAttendees = attendees ? `{${JSON.parse(attendees || '[]').join(',')}}` : null;
      parsedTabs = tabs ? JSON.parse(tabs).map(tab => JSON.stringify(tab)) : null;
      parsedPackages = packages ? JSON.parse(packages).map(pkg => JSON.stringify(pkg)) : null;
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid JSON format for attendees, tabs, or packages',
        details: e.message
      });
    }

    // Update event details
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
    `;

    const eventValues = [
      name, description, location, start_date, end_date,
      start_time, end_time, duration, deadlinetime, deadlinedate,
      event_type, parseInt(capacity, 10), parsedAttendees, contactnum, email,
      parsedTabs, parsedPackages, terms_and_conditions,
      'pending', // Set status to pending after edit
      eventId
    ];

    const eventResult = await client.query(updateEventQuery, eventValues);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Handle cover image upload if provided
    let coverImageUrl = null;
    let coverImageKey = null;
    if (req.files && req.files['cover_image']) {
      const file = req.files['cover_image'][0];
      const sanitizedFileName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      coverImageKey = `cover_images/${eventId}/${Date.now()}_${sanitizedFileName}`;

      const coverImageCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: coverImageKey,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await s3Client.send(coverImageCommand);
      coverImageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.af-south-1.amazonaws.com/${coverImageKey}`;
      console.log('Cover image uploaded:', coverImageUrl);

      await client.query(
        'UPDATE events SET coverimage = $1 WHERE event_id = $2',
        [coverImageUrl, eventId]
      );
    }

    await client.query('COMMIT');

    // Fetch the updated event
    const { rows: [updatedEvent] } = await client.query(
      `SELECT e.*, 
              up.firstname, up.surname, up.email, up.cellnumber
       FROM events e
       LEFT JOIN user_profiles up ON e.user_id = up.user_id
       WHERE e.event_id = $1`,
      [eventId]
    );

    // Generate presigned URL for response
    const finalCoverImageUrl = updatedEvent.coverimage
      ? await generatePresignedUrl(updatedEvent.coverimage.split('/').slice(3).join('/'))
      : '/default-profile-picture.jpg';

    res.json({
      message: 'Event updated successfully and set to pending',
      event: {
        ...updatedEvent,
        coverimage: finalCoverImageUrl,
      },
      coverImageUrl: finalCoverImageUrl,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating event:', error);
    res.status(500).json({
      error: 'Failed to update event',
      details: error.message
    });
  } finally {
    client.release();
  }
});





// Admin routes
// Get all events for admin (all users' events)
app.get("/api/admin/events", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { role } = req.user;

    // Check if user is admin
    if (role !== "Admin") {
      return res.status(403).json({
        error: "Access denied. Admin privileges required.",
      });
    }

    const query = `
      SELECT 
        e.event_id as id,
        e.name as event_name,
        e.description,
        e.terms_and_conditions,
        e.location,
        e.startdate as date,
        e.enddate as end_date,
        e.time,
        e.endtime as end_time,
        e.duration,
        e.deadlinetime as registration_deadline_time,
        e.deadlinedate as registration_deadline_date,
        e.type as event_type,
        e.capacity,
        e.attendees,
        e.contactnum,
        e.email,
        e.coverimage,
        e.tabs,
        e.packages,
        e.status,
        e.admin_comment,
        e.user_id,
        p.amount as paid_amount,
        p.payment_type,
        p.proof_of_payment as payment_proof_key,
        up.firstname as organizer_first_name,
        up.surname as organizer_last_name,
        up.cellnumber as organizer_phone,
        up.email as organizer_email
      FROM events e
      LEFT JOIN payments p ON e.event_id = p.event_id
      LEFT JOIN user_profiles up ON e.user_id = up.user_id
      ORDER BY e.startdate DESC, e.time DESC
    `;

    console.log("Admin fetching all events");
    const result = await client.query(query);

    const eventsWithUrls = await Promise.all(
      result.rows.map(async (event) => {
        let coverImageUrl = "/default-profile-picture.jpg";
        let proofOfPaymentUrl = null;

        if (event.coverimage) {
          const coverKey = event.coverimage.split("/").slice(3).join("/");
          try {
            coverImageUrl = await generatePresignedUrl(coverKey);
          } catch (e) {
            console.warn("Failed to generate signed URL for cover image:", e);
          }
        }

        if (event.payment_proof_key) {
          const proofKey = event.payment_proof_key.split("/").slice(3).join("/");
          try {
            proofOfPaymentUrl = await generatePresignedUrl(proofKey);
          } catch (e) {
            console.warn("Failed to generate signed URL for proof of payment:", e);
          }
        }

        const parsedTabs = event.tabs
          ? event.tabs.map((tab) => {
            try {
              return JSON.parse(tab);
            } catch (e) {
              console.warn(`Failed to parse tab: ${tab}`, e);
              return {};
            }
          })
          : [];

        const parsedPackages = event.packages
          ? event.packages.map((pkg) => {
            try {
              return JSON.parse(pkg);
            } catch (e) {
              console.warn(`Failed to parse package: ${pkg}`, e);
              return {};
            }
          })
          : [];

        return {
          id: event.id,
          event_name: event.event_name,
          description: event.description,
          terms_and_conditions: event.terms_and_conditions,
          location: event.location,
          date: event.date,
          end_date: event.end_date,
          time: event.time,
          end_time: event.end_time,
          duration: event.duration,
          registration_deadline_time: event.registration_deadline_time,
          registration_deadline_date: event.registration_deadline_date,
          event_type: event.event_type,
          capacity: event.capacity,
          attendees: event.attendees,
          contactnum: event.contactnum,
          email: event.email,
          status: event.status,
          admin_comment: event.admin_comment,
          user_id: event.user_id,
          paid_amount: event.paid_amount,
          payment_type: event.payment_type,
          payment_proof_key: event.payment_proof_key,
          coverimage: coverImageUrl,
          file_url: coverImageUrl, // used on frontend
          payment_proof_url: proofOfPaymentUrl,
          tabs: parsedTabs,
          packages: parsedPackages,
          organizer: {
            name: `${event.organizer_first_name || ""} ${event.organizer_last_name || ""}`.trim(),
            phone: event.organizer_phone || "N/A",
            email: event.organizer_email || "N/A",
          },
        };
      })
    );

    console.log("Admin events fetched:", eventsWithUrls.length, "events");
    res.json(eventsWithUrls);
  } catch (error) {
    console.error("Error fetching admin events:", error);
    res.status(500).json({
      error: "Failed to fetch events",
      details: error.message,
    });
  } finally {
    client.release();
  }
});


// Get specific event by ID for admin (can access any event)
app.get("/api/admin/events/:eventId", authenticateToken, async (req, res) => {
  const client = await pool.connect()

  try {
    const { eventId } = req.params
    const { role } = req.user

    // Check if user is admin
    if (role !== "Admin") {
      return res.status(403).json({
        error: "Access denied. Admin privileges required.",
      })
    }

    const query = `
      SELECT 
        e.event_id as id,
        e.name,
        e.description,
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
        e.contactnum,
        e.email,
        e.coverimage,
        e.tabs,
        e.packages,
        e.terms_and_conditions,
        e.status,
        e.admin_comment,
        e.user_id,
        p.payment_id,
        p.amount as paid_amount,
        p.payment_type,
        p.proof_of_payment as payment_proof_key,
        up.firstname as organizer_first_name,
        up.surname as organizer_last_name,
        up.cellnumber as organizer_phone,
        up.email as organizer_email
      FROM events e
      LEFT JOIN payments p ON e.event_id = p.event_id
      LEFT JOIN user_profiles up ON e.user_id = up.user_id
      WHERE e.event_id = $1
    `

    console.log("Admin fetching event by ID:", eventId)
    console.log("Query:", query)

    const result = await client.query(query, [eventId])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" })
    }

    const event = result.rows[0]

    // Generate presigned URLs
    let coverImageUrl = "/default-profile-picture.jpg"
    let proofOfPaymentUrl = null

    if (event.coverimage) {
      const coverKey = event.coverimage.split("/").slice(3).join("/")
      if (coverKey) {
        try {
          coverImageUrl = await generatePresignedUrl(coverKey)
        } catch (e) {
          console.warn("Failed to generate signed URL for cover image:", e)
        }
      }
    }

    if (event.payment_proof_key) {
      const proofKey = event.payment_proof_key.split("/").slice(3).join("/")
      if (proofKey) {
        try {
          proofOfPaymentUrl = await generatePresignedUrl(proofKey)
        } catch (e) {
          console.warn("Failed to generate signed URL for proof of payment:", e)
        }
      }
    }

    // Parse tabs and packages
    event.tabs = event.tabs
      ? event.tabs.map((tab) => {
        try {
          return JSON.parse(tab)
        } catch (e) {
          console.warn(`Failed to parse tab: ${tab}`, e)
          return {}
        }
      })
      : []

    event.packages = event.packages
      ? event.packages.map((pkg) => {
        try {
          return JSON.parse(pkg)
        } catch (e) {
          console.warn(`Failed to parse package: ${pkg}`, e)
          return {}
        }
      })
      : []

    // Format organizer data
    event.organizer = {
      name: `${event.organizer_first_name || ""} ${event.organizer_last_name || ""}`.trim(),
      phone: event.organizer_phone || "N/A",
      email: event.organizer_email || "N/A",
      amount:
        event.payment_type === "Sponsor" && event.paid_amount
          ? `R ${Number.parseFloat(event.paid_amount).toFixed(2)}`
          : "",
    }

    res.json({
      ...event,
      coverimage: coverImageUrl,
      payment_proof_url: proofOfPaymentUrl,
    })
  } catch (error) {
    console.error("Error fetching admin event:", error)
    res.status(500).json({
      message: "Failed to fetch event",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  } finally {
    client.release()
  }
})

// Delete an event
app.delete('/api/events/:eventId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { eventId } = req.params;
    const { userId, role } = req.user;

    // Check if the user is the organizer or an admin
    const eventCheck = await client.query(
      'SELECT event_id FROM events WHERE event_id = $1 AND (user_id = $2 OR $3 = true)',
      [eventId, userId, role === 'Admin']
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }

    await client.query('BEGIN');

    // Delete related records
    await client.query('DELETE FROM payments WHERE event_id = $1', [eventId]);

    // Delete the event
    const result = await client.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [eventId]);

    if (result.rows.length === 0) {
      throw new Error('Event not found after verification');
    }

    await client.query('COMMIT');

    res.json({ message: 'Event deleted successfully', event: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Failed to delete event',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Faculty & Department lookup endpoints
app.get('/api/faculties', async (req, res) => {
  try {
    const facultiesResult = await pool.query(
      'SELECT faculty_id AS value, faculty_name AS label FROM faculties ORDER BY faculty_name'
    );
    res.json(facultiesResult.rows);
  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json({
      message: 'Failed to fetch faculties',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const { facultyId } = req.query;
    let query;
    let queryParams = [];

    if (facultyId) {
      query = `
        SELECT 
          d.department_id AS value, 
          d.department_name AS label,
          f.faculty_name
        FROM departments d
        JOIN faculties f ON d.faculty_id = f.faculty_id
        WHERE d.faculty_id = $1
        ORDER BY d.department_name`;
      queryParams = [facultyId];
    } else {
      query = `
        SELECT 
          d.department_id AS value, 
          d.department_name AS label,
          f.faculty_name
        FROM departments d
        JOIN faculties f ON d.faculty_id = f.faculty_id
        ORDER BY f.faculty_name, d.department_name`;
    }

    const departmentsResult = await pool.query(query, queryParams);
    res.json(departmentsResult.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      message: 'Failed to fetch departments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin endpoint to get proof of payment for an event
app.get('/api/admin/event/:eventId/proof-of-payment', authenticateToken, authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { eventId } = req.params;
    const result = await client.query(
      'SELECT proof_of_payment FROM payments WHERE event_id = $1',
      [eventId]
    );

    if (result.rows.length === 0 || !result.rows[0].proof_of_payment) {
      return res.status(404).json({ error: 'Proof of payment not found' });
    }

    res.status(200).json({ url: result.rows[0].proof_of_payment });
  } catch (err) {
    console.error('Error fetching proof of payment:', err);
    res.status(500).json({ error: 'Failed to fetch proof of payment', details: err.message });
  } finally {
    client.release();
  }
});

// Admin endpoint to update event status
app.put('/api/admin/event/:eventId/status', authenticateToken, authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { eventId } = req.params;
    const { status, comment } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!status || !['Approved', 'Rejected', 'Request Edit', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (Approved, Rejected, Request Edit, or pending)' });
    }

    await client.query('BEGIN');

    // Update the event status in the database
    const updateResult = await client.query(
      'UPDATE events SET status = $1, admin_comment = $2 WHERE event_id = $3 RETURNING *',
      [status, comment || null, eventId]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: `Event status updated to ${status}`,
      event: updateResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating event status:', err);
    res.status(500).json({ error: 'Failed to update event status', details: err.message });
  } finally {
    client.release();
  }
});

// Get users who have events
app.get('/api/users-with-events', async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        up.user_id, 
        up.firstname, 
        up.surname, 
        up.email, 
        e.name as event_name, 
        e.startdate 
      FROM 
        user_profiles up 
      INNER JOIN 
        events e ON up.user_id = e.user_id
    `;
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users with events:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});
// Add to server.js











// Get all customers
app.get('/api/customers', async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        up.user_id, 
        up.firstname, 
        up.surname, 
        up.email, 
        up.phone_number,
        up.created_at
      FROM 
        user_profiles up 
      WHERE 
        up.role = 'customer'
      ORDER BY 
        up.created_at DESC
    `;
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get all payments
app.get('/api/payments', async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        p.payment_id, 
        p.event_id, 
        p.amount, 
        p.payment_date,
        p.payment_status,
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
      ORDER BY 
        p.payment_date DESC
    `;
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get user profile by ID
app.get('/api/user-profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const client = await pool.connect();
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
    `;
    const result = await client.query(query, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get events by user ID
app.get('/api/user-events/:userId', async (req, res) => {
  const { userId } = req.params;
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM events WHERE user_id = $1
    `;
    const result = await client.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get payment by event ID
app.get('/api/event-payment/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM payments WHERE event_id = $1
    `;
    const result = await client.query(query, [eventId]);
    if (result.rows.length === 0) {
      return res.json({ amount: null });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

//----------------payments org start
// Get all events with pending ticket request counts
app.get('/api/organiser/events', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.user;
    const query = `
      SELECT
        e.event_id,
        e.name AS event_name,
        COALESCE(COUNT(tp.purchase_id), 0) AS request_count
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id AND tp.request_status = 'pending'
      WHERE e.user_id = $1
      GROUP BY e.event_id, e.name
      ORDER BY e.event_id DESC
    `;
    const result = await client.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Get ticket purchase requests for a specific event
app.get('/api/organiser/events/:eventId/ticket-requests', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { eventId } = req.params;
    const { userId } = req.user;
    const { all } = req.query; // Optional query param to fetch all statuses

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
      WHERE e.event_id = $1 AND e.user_id = $2 ${all ? '' : "AND tp.request_status = 'pending'"}
      ORDER BY tp.purchase_id DESC
    `;
    const result = await client.query(query, [eventId, userId]);

    const requestsWithUrls = await Promise.all(result.rows.map(async (request) => {
      let proofOfPaymentUrl = null;
      if (request.proof_of_payment) {
        const proofKey = request.proof_of_payment.startsWith('http')
          ? request.proof_of_payment.split('/').slice(3).join('/')
          : request.proof_of_payment;
        try {
          proofOfPaymentUrl = await generatePresignedUrl(proofKey);
        } catch (e) {
          console.warn(`Failed to generate signed URL for proof of payment: ${proofKey}`, e);
        }
      }

      return {
        ...request,
        proof_of_payment_url: proofOfPaymentUrl,
        purchaser_name: `${request.firstname} ${request.surname}`.trim(),
      };
    }));

    console.log('Fetched ticket requests for event:', eventId, 'Count:', requestsWithUrls.length);
    res.json(requestsWithUrls);
  } catch (error) {
    console.error('Error fetching ticket requests:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket requests',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Update ticket purchase request status
app.put('/api/organiser/ticket-requests/:purchaseId/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { purchaseId } = req.params;
    const { userId } = req.user;
    const { request_status } = req.body;

    if (!request_status || !['Approved', 'Rejected', 'pending'].includes(request_status)) {
      return res.status(400).json({ error: 'Valid request status is required (Approved, Rejected, or pending)' });
    }

    await client.query('BEGIN');

    const query = `
      UPDATE ticket_purchases
      SET request_status = $1
      FROM events e
      WHERE ticket_purchases.purchase_id = $2 AND e.event_id = ticket_purchases.event_id AND e.user_id = $3
      RETURNING ticket_purchases.*
    `;
    const result = await client.query(query, [request_status, purchaseId, userId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket purchase not found or access denied' });
    }

    await client.query('COMMIT');
    res.json({
      message: `Ticket request status updated to ${request_status}`,
      purchase: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating ticket request status:', error);
    res.status(500).json({
      error: 'Failed to update ticket request status',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Get all ticket purchases for organiser's events
app.get('/api/organiser/ticket-purchases', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.user;

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
    `;
    const result = await client.query(query, [userId]);

    const purchasesWithUrls = await Promise.all(result.rows.map(async (purchase) => {
      let proofOfPaymentUrl = null;
      if (purchase.proof_of_payment) {
        const proofKey = purchase.proof_of_payment.split('/').slice(3).join('/');
        try {
          proofOfPaymentUrl = await generatePresignedUrl(proofKey);
        } catch (e) {
          console.warn(`Failed to generate signed URL for proof of payment: ${proofKey}`, e);
        }
      }

      return {
        ...purchase,
        proof_of_payment_url: proofOfPaymentUrl,
        purchaser_name: `${purchase.firstname} ${purchase.surname}`.trim(),
      };
    }));

    console.log('Fetched ticket purchases for organiser:', userId, 'Count:', purchasesWithUrls.length);
    res.json(purchasesWithUrls);
  } catch (error) {
    console.error('Error fetching ticket purchases:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket purchases',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Get single ticket purchase by ID
app.get('/api/organiser/ticket-purchases/:purchaseId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { purchaseId } = req.params;
    const { userId } = req.user;

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
      LEFT JOIN departments d ON up.department_id = d.department_id
      WHERE tp.purchase_id = $1 AND e.user_id = $2
    `;
    const result = await client.query(query, [purchaseId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket purchase not found or access denied' });
    }

    const purchase = result.rows[0];
    let proofOfPaymentUrl = null;
    if (purchase.proof_of_payment) {
      const proofKey = purchase.proof_of_payment.split('/').slice(3).join('/');
      try {
        proofOfPaymentUrl = await generatePresignedUrl(proofKey);
      } catch (e) {
        console.warn(`Failed to generate signed URL for proof of payment: ${proofKey}`, e);
      }
    }

    res.json({
      ...purchase,
      proof_of_payment_url: proofOfPaymentUrl,
      purchaser_name: `${purchase.firstname} ${purchase.surname}`.trim(),
    });
  } catch (error) {
    console.error('Error fetching ticket purchase:', error);
    res.status(500).json({
      error: 'Failed to fetch ticket purchase',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Update ticket purchase status
app.put('/api/organiser/ticket-purchases/:purchaseId/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { purchaseId } = req.params;
    const { userId } = req.user;
    const { status } = req.body;

    if (!status || !['Approved', 'Rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (Approved, Rejected, or pending)' });
    }

    await client.query('BEGIN');

    const query = `
      UPDATE ticket_purchases
      SET status = $1
      FROM events e
      WHERE ticket_purchases.purchase_id = $2 AND e.event_id = ticket_purchases.event_id AND e.user_id = $3 AND ticket_purchases.request_status = 'Approved'
      RETURNING ticket_purchases.*
    `;
    const result = await client.query(query, [status, purchaseId, userId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ticket purchase not found or access denied' });
    }

    await client.query('COMMIT');
    res.json({
      message: `Ticket purchase status updated to ${status}`,
      purchase: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating ticket purchase status:', error);
    res.status(500).json({
      error: 'Failed to update ticket purchase status',
      details: error.message,
    });
  } finally {
    client.release();
  }
});

//Analytics
app.get('/api/organiser/analytics', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.user;

    // Query for Profit vs Tickets Sold
    const profitVsTicketsQuery = `
      SELECT 
        e.event_id,
        e.name AS event,
        COALESCE(SUM(tp.amount), 0) AS tickets_sold,
        COALESCE(SUM(tp.amount), 0) - COALESCE(p.amount, 0) AS profit,
        TO_CHAR(e.startdate, 'Month') AS month,
        TO_CHAR(e.startdate, 'YYYY') AS year
      FROM events e
      LEFT JOIN ticket_purchases tp ON e.event_id = tp.event_id AND tp.status = 'Approved'
      LEFT JOIN payments p ON e.event_id = p.event_id
      WHERE e.user_id = $1
      GROUP BY e.event_id, e.name, p.amount, e.startdate
      ORDER BY e.startdate DESC;
    `;

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
    `;

    const [profitVsTicketsResult, attendanceResult] = await Promise.all([
      client.query(profitVsTicketsQuery, [userId]),
      client.query(attendanceQuery, [userId]),
    ]);

    // Format data for frontend
    const analyticsData = {
      profitVsTickets: profitVsTicketsResult.rows.map(row => ({
        event: row.event,
        profit: parseFloat(row.profit) || 0,
        ticketsSold: parseFloat(row.tickets_sold) || 0,
        month: row.month.trim(),
        year: row.year,
      })),
      attendance: attendanceResult.rows.map(row => ({
        event: row.event,
        attendance: parseInt(row.attendance, 10) || 0,
        capacity: parseInt(row.capacity, 10) || 0,
        month: row.month.trim(),
        year: row.year,
      })),
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      details: error.message,
    });
  } finally {
    client.release();
  }
});
//----------------payments org end

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});