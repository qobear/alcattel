'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface MediaUploadProps {
  animalId: string
  onUploadComplete?: (media: any) => void
}

export function MediaUpload({ animalId, onUploadComplete }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleFileUpload = async (file: File, pose: string) => {
    setUploading(true)
    
    try {
      // Get signed URL from API
      const response = await fetch(`/api/animals/${animalId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pose,
          contentType: file.type,
          fileName: file.name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { signedUrl, fields, key } = await response.json()

      // Upload file to S3 using signed URL
      const formData = new FormData()
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string)
      })
      formData.append('file', file)

      const uploadResponse = await fetch(signedUrl, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Record media in database
      const mediaResponse = await fetch(`/api/animals/${animalId}/media`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          pose,
          contentType: file.type,
          fileName: file.name
        })
      })

      if (mediaResponse.ok) {
        const media = await mediaResponse.json()
        setUploadedFiles(prev => [...prev, media])
        onUploadComplete?.(media)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const PhotoUploadCard = ({ pose, title, description }: { pose: string, title: string, description: string }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <Label htmlFor={`photo-${pose}`} className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Click to upload {pose} photo
                </span>
              </Label>
              <Input
                id={`photo-${pose}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, pose)
                }}
              />
            </div>
          </div>
          
          {uploadedFiles.find(f => f.pose === pose) && (
            <div className="text-center">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ {pose} photo uploaded
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Animal Media Upload</h3>
        <p className="text-sm text-gray-500">Upload photos from 3 different angles and a gait video</p>
      </div>

      {/* Photo Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhotoUploadCard 
          pose="front" 
          title="Front View" 
          description="Photo from the front showing head and chest"
        />
        <PhotoUploadCard 
          pose="left" 
          title="Left Side" 
          description="Profile view from the left side"
        />
        <PhotoUploadCard 
          pose="right" 
          title="Right Side" 
          description="Profile view from the right side"
        />
      </div>

      {/* Video Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gait Video</CardTitle>
          <CardDescription>Video of the animal walking (for gait analysis)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="mt-4">
              <Label htmlFor="gait-video" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Click to upload gait video
                </span>
              </Label>
              <Input
                id="gait-video"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'gait')
                }}
              />
              <p className="mt-1 text-xs text-gray-500">MP4, MOV up to 200MB</p>
            </div>
          </div>
          
          {uploadedFiles.find(f => f.pose === 'gait') && (
            <div className="text-center mt-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Gait video uploaded
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Upload Progress</span>
            <span className="text-sm text-gray-500">
              {uploadedFiles.length} / 4 files uploaded
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(uploadedFiles.length / 4) * 100}%` }}
            />
          </div>
          
          {uploadedFiles.length === 4 && (
            <div className="mt-4 text-center">
              <Badge className="bg-green-600 text-white">
                ✓ All media uploaded successfully!
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-sm text-gray-600">Uploading file...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
