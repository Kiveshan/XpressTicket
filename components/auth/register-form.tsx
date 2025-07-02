"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phoneNumber: "",
    institutionLocation: "",
    faculty: "",
    department: "",
    ieeeNum: "",
    organVAT: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Registration failed")
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please sign in.",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Dr., Prof., Mr., Ms."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="institutionLocation">Institution/Location</Label>
          <Input
            id="institutionLocation"
            name="institutionLocation"
            value={formData.institutionLocation}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="faculty">Faculty</Label>
          <Input id="faculty" name="faculty" value={formData.faculty} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" name="department" value={formData.department} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ieeeNum">IEEE Number</Label>
          <Input id="ieeeNum" name="ieeeNum" value={formData.ieeeNum} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organVAT">Organization VAT</Label>
          <Input id="organVAT" name="organVAT" value={formData.organVAT} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
}
