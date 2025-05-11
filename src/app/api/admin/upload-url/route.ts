import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'creator') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { fileName, fileType } = await req.json()
    
    if (!fileName || !fileType) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const key = `uploads/${Date.now()}-${fileName}`
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: fileType
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({ uploadUrl, videoKey: key })
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 