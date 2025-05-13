import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from 'next-auth/react'

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session || typeof session.user.email !== 'string') {
    redirect('/login');
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (user?.role === 'CREATOR') {
    redirect('/admin');
  }
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Account</h1>
        <div className="mb-4 text-white">Signed in as: {user?.email}</div>
        <Button onClick={() => signOut({ callbackUrl: '/login' })} className="mb-8">Sign Out</Button>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input id="firstName" placeholder="John" className="bg-black/50 border-white/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="bg-black/50 border-white/20 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" className="bg-black/50 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input id="username" placeholder="johndoe" className="bg-black/50 border-white/20 text-white" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-[#1B4D3E] hover:bg-[#153B30]">Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Subscription Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Current Plan</Label>
                  <div className="p-4 bg-black/50 border border-white/20 rounded-lg">
                    <p className="text-white font-semibold">Premium Plan</p>
                    <p className="text-gray-400">$29.99/month</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Billing Information</Label>
                  <div className="p-4 bg-black/50 border border-white/20 rounded-lg">
                    <p className="text-white">•••• •••• •••• 4242</p>
                    <p className="text-gray-400">Expires 12/24</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                  Change Plan
                </Button>
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                  Update Payment
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                  <Input id="currentPassword" type="password" className="bg-black/50 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white">New Password</Label>
                  <Input id="newPassword" type="password" className="bg-black/50 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" className="bg-black/50 border-white/20 text-white" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-[#1B4D3E] hover:bg-[#153B30]">Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 