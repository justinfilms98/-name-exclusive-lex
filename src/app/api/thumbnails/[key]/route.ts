import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { authOptions } from '@/lib/auth'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: params.key
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600 // 1 hour
    })

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('Error generating thumbnail URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate thumbnail URL' },
      { status: 500 }
    )
  }
} 