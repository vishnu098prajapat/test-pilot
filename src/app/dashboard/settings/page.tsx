
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, ShieldAlert, Edit, Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

const settingsSchema = z.object({
  displayName: z.string().min(1, "Name is required."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be in YYYY-MM-DD format."),
  profileImageFile: z.any().optional(), 
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading, updateUserProfileData } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "",
      dob: "",
      profileImageFile: null,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName,
        dob: user.dob,
        profileImageFile: null, 
      });
      setPreviewImage(user.profileImageUrl || null);
    }
  }, [user, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast({ title: "Invalid File Type", description: "Please select a PNG, JPG, or JPEG image.", variant: "destructive" });
        form.setValue("profileImageFile", null);
        setPreviewImage(user?.profileImageUrl || null); 
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        form.setValue("profileImageFile", null);
        setPreviewImage(user?.profileImageUrl || null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        form.setValue("profileImageFile", file); 
      };
      reader.readAsDataURL(file);
    } else {
        form.setValue("profileImageFile", null);
        setPreviewImage(user?.profileImageUrl || null); 
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    const updates: { displayName?: string; dob?: string; profileImageUrl?: string } = {};
    let changed = false;

    if (data.displayName !== user.displayName) {
      updates.displayName = data.displayName;
      changed = true;
    }
    if (data.dob !== user.dob) {
      updates.dob = data.dob;
      changed = true;
    }
    
    if (data.profileImageFile && previewImage && previewImage !== user.profileImageUrl) { 
      updates.profileImageUrl = previewImage; 
      changed = true;
      console.log("New profile image (base64) prepared for mock saving:", previewImage.substring(0,50) + "...");
    } else if (!data.profileImageFile && !previewImage && user.profileImageUrl) {
      // This logic is if user wants to REMOVE existing image
      // For now, we don't have a "remove image" button, so this case isn't directly hit
      // If we wanted to allow removal, we'd set updates.profileImageUrl = "" or null.
      // updates.profileImageUrl = ""; // Example for removal
      // changed = true;
    }


    if (!changed) {
      toast({ title: "No Changes", description: "No changes were made to your profile.", duration: 2000 });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await updateUserProfileData(updates);
      if (result.success && result.user) {
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated.", duration: 2000 });
        // Update form defaults and preview again to reflect saved state
        form.reset({ 
          displayName: result.user.displayName, 
          dob: result.user.dob, 
          profileImageFile: null 
        });
        setPreviewImage(result.user.profileImageUrl || null);
      } else {
        toast({ title: "Update Failed", description: result.message || "Could not update profile.", variant: "destructive", duration: 2000 });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive", duration: 2000 });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  if (isAuthLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex items-center mb-8"> <Skeleton className="w-10 h-10 rounded-full mr-3" /><Skeleton className="h-8 w-48" /> </div>
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader className="items-center text-center"> <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-4" /> <Skeleton className="h-7 w-1/2 mx-auto" /> <Skeleton className="h-4 w-3/4 mx-auto mt-2" /> </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter> <Skeleton className="h-10 w-24 ml-auto" /> </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-2 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Please log in to manage your settings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center mb-8">
        <Settings className="w-8 h-8 md:w-10 md:h-10 text-primary mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Account Settings</h1>
      </div>

      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="items-center text-center">
              <div className="relative group w-24 h-24 md:w-32 md:h-32 mx-auto mb-4">
                <Image
                  src={previewImage || user.profileImageUrl || "https://placehold.co/128x128.png"} 
                  alt={user.displayName || "User"}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-2 border-muted"
                  data-ai-hint="user profile"
                  key={previewImage || user.profileImageUrl} 
                />
                <label
                  htmlFor="profileImageFile"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </label>
              </div>
               <FormField
                  control={form.control}
                  name="profileImageFile"
                  render={({ field: { onChange, onBlur, name, ref }}) => ( // Destructure to avoid passing `value` to file input
                    <FormItem className="hidden">
                      <FormControl>
                        <Input
                          id="profileImageFile"
                          type="file"
                          accept=".png, .jpg, .jpeg"
                          onChange={(e) => {
                            onChange(e.target.files ? e.target.files[0] : null); // Pass File object or null
                            handleImageChange(e); // Handle preview separately
                          }}
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <CardTitle className="text-xl md:text-2xl font-headline">{form.watch("displayName") || user.displayName}</CardTitle>
              <CardDescription>Update your profile information below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        className="w-full"
                        min="1900-01-01"
                        max={getMaxDate()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Note: Email and Role cannot be changed. Profile image changes are saved as base64 data URIs in this mock version, which can increase local data size significantly. This is for demonstration purposes only.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isAuthLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
