import MainLayout from "@/layouts/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Camera, Star, Download, Calendar, FileText } from "lucide-react";
import { Link } from "wouter";

const API_BASE = 'http://localhost:5000/api';

interface Review {
  reviewId: number;
  rating: number;
  reviewDate: string;
  paperId: number;
  paperTitle: string;
  publicationDate: string;
}

interface DownloadItem {
  downloadId: number;
  downloadDate: string;
  paperId: number;
  paperTitle: string;
  publicationDate: string;
  abstract: string;
}

interface UserProfile {
  userId: number;
  name: string;
  email: string;
  role: string;
  affiliation: string;
  specialization: string;
  photo: string | null;
  recentReviews: Review[];
  recentDownloads: DownloadItem[];
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("You must be logged in to view your profile");
        toast.error("You must be logged in to view your profile");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
          if (data.data.photo) {
            setPhotoPreview(`data:image/jpeg;base64,${data.data.photo}`);
          }
          setError(null);
        } else {
          setError(data.message || "Failed to fetch profile data");
          toast.error(data.message || "Failed to fetch profile data");
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setError("Network error while fetching profile");
        toast.error("Network error while fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedReader = new FileReader();
                compressedReader.readAsDataURL(blob);
                compressedReader.onloadend = () => {
                  resolve(compressedReader.result as string);
                };
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile) {
      setProfile({
        ...profile,
        [e.target.id]: e.target.value,
      });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      try {
        toast.info("Compressing image...");
        const compressedImage = await compressImage(file, 800, 0.7);
        setPhotoPreview(compressedImage);
        setPhotoFile(compressedImage);
        toast.success("Image loaded successfully");
      } catch (error) {
        console.error('Image compression error:', error);
        toast.error("Failed to process image");
      }
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          affiliation: profile.affiliation,
          specialization: profile.specialization,
          photo: photoFile,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile updated successfully");
        localStorage.setItem("userName", data.data.name);
        window.dispatchEvent(new Event("insight:auth-changed"));
        setPhotoFile(null);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error("Network error while updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-red-600">{error || "Profile data could not be loaded."}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={photoPreview || undefined} alt={profile.name} />
                        <AvatarFallback className="text-2xl">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">Click to change photo (max 10MB)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={profile.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Read-only)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role (Read-only)</Label>
                      <Input
                        id="role"
                        type="text"
                        value={profile.role || ""}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="affiliation">Affiliation</Label>
                      <Input
                        id="affiliation"
                        type="text"
                        value={profile.affiliation || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        type="text"
                        value={profile.specialization || ""}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recent Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.recentReviews && profile.recentReviews.length > 0 ? (
                  <div className="space-y-4">
                    {profile.recentReviews.map((review) => (
                      <Link key={review.reviewId} href={`/papers/${review.paperId}`}>
                        <a className="block p-3 border rounded hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{review.paperTitle}</h4>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(review.reviewDate)}
                            </span>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No reviews yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Recent Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.recentDownloads && profile.recentDownloads.length > 0 ? (
                  <div className="space-y-4">
                    {profile.recentDownloads.map((download) => (
                      <Link key={download.downloadId} href={`/papers/${download.paperId}`}>
                        <a className="block p-3 border rounded hover:bg-gray-50 transition-colors">
                          <h4 className="font-medium text-sm line-clamp-2 mb-2">{download.paperTitle}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(download.downloadDate)}</span>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No downloads yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}