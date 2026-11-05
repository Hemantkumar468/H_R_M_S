'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/store/auth-context';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, Mail, Sparkles } from 'lucide-react';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch {
      // error toast handled in AuthProvider
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-2xl shadow-md">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">HRMS Enterprise</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to access your employee & management workspace
          </p>
        </div>

        {/* Login Card */}
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>Enter your corporate credentials below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" required>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-9"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                Sign In to Dashboard
              </Button>
            </form>

            {/* Quick-Fill Demo Pills */}
            <div className="mt-6 pt-5 border-t">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Quick Demo Accounts (Tap to populate):</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoFill('superadmin@hrms.local', 'SuperAdmin@12345')}
                  className="p-2 rounded-lg border bg-muted/40 hover:bg-muted text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Super Admin</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    superadmin@hrms.local
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('priya.hr@hrms.local', 'Password@123')}
                  className="p-2 rounded-lg border bg-muted/40 hover:bg-muted text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">HR Admin</p>
                  <p className="text-[11px] text-muted-foreground truncate">priya.hr@hrms.local</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('rajesh.manager@hrms.local', 'Password@123')}
                  className="p-2 rounded-lg border bg-muted/40 hover:bg-muted text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Manager</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    rajesh.manager@hrms.local
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('anita.dev@hrms.local', 'Password@123')}
                  className="p-2 rounded-lg border bg-muted/40 hover:bg-muted text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Employee</p>
                  <p className="text-[11px] text-muted-foreground truncate">anita.dev@hrms.local</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
