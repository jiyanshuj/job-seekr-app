import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Configuration - Updated to prioritize EXPO_PUBLIC_API_URL
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Priority: 1. EXPO_PUBLIC_API_URL (production/staging), 2. localhost (development fallback)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Helper function to check if we're using localhost
const isUsingLocalhost = () => {
  return API_BASE_URL.includes('127.0.0.1') || API_BASE_URL.includes('localhost');
};

// Helper function to get environment info
const getEnvironmentInfo = () => {
  const usingLocalhost = isUsingLocalhost();
  return {
    apiUrl: API_BASE_URL,
    isLocalhost: usingLocalhost,
    environment: usingLocalhost ? 'Development (Local)' : 'Production/Staging'
  };
};

interface ParsedResumeData {
  // Personal Info
  "First Name"?: string;
  "Last Name"?: string;
  "Full Name"?: string;
  Email?: string;
  "Phone Number"?: string;
  Location?: string;
  "Willing to relocate"?: boolean;
  
  // Professional Info
  Role?: string;
  "Company details"?: string;
  "Resume file"?: string;
  "Resume URL"?: string;
  
  // Skills
  "Technical Skills"?: string[];
  "Soft Skills"?: string[];
  Skills?: string[];
  
  // Experience & Education
  Experience?: Array<{
    Company: string;
    Role: string;
    Duration: string;
    Description: string;
  }>;
  Education?: Array<{
    Degree: string;
    University: string;
    Year: string;
  }>;
  Certifications?: string[];
  Projects?: Array<{
    Name: string;
    Description: string;
    Technologies?: string[];
  }>;
  
  // Social Links
  "LinkedIn Profile"?: string;
  "GitHub Profile"?: string;
  "Portfolio URL"?: string;
}

const SeekerProfile = () => {
  const { signOut, userId } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [clerkId, setClerkId] = useState("");
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role || "JOB_SEEKER";
  const isNew = user?.unsafeMetadata?.new;
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string, name: string, uploadDate: string}>>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // States for editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ParsedResumeData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Function to open resume URL
  const openResume = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAlert("Error", "Cannot open this file type on your device");
      }
    } catch (error) {
      console.error("Error opening resume:", error);
      showAlert("Error", "Failed to open resume");
    }
  };

  // Fetch existing user profile from backend
  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      setIsLoadingProfile(true);
      console.log("Fetching profile for user:", userId);

      const response = await axios.get(
        `${API_BASE_URL}/api/users/me?clerk_id=${userId}`
      );

      if (response.status === 200) {
        const profile = response.data;
        setUserProfile(profile);
        console.log("Profile data received:", profile);
        
        // If user already has parsed resume data, show it
        if (profile.skills || profile.experience || profile.technical_skills || profile.soft_skills) {
          const formattedData: ParsedResumeData = {
            // Personal Info
            "First Name": profile.first_name,
            "Last Name": profile.last_name,
            "Full Name": profile.full_name,
            Email: profile.email,
            "Phone Number": profile.phone,
            Location: profile.location,
            "Willing to relocate": profile.willing_to_relocate,
            
            // Professional Info
            Role: profile.role || "job_seeker",
            "Company details": profile.current_company,
            "Resume file": profile.resume_filename,
            "Resume URL": profile.resume_url,
            
            // Skills - prioritize categorized skills over general skills
            "Technical Skills": profile.technical_skills && profile.technical_skills.length > 0 ? profile.technical_skills : null,
            "Soft Skills": profile.soft_skills && profile.soft_skills.length > 0 ? profile.soft_skills : null,
            Skills: profile.skills,
            
            // Social Links
            "LinkedIn Profile": profile.social_links?.linkedin,
            "GitHub Profile": profile.social_links?.github,
            "Portfolio URL": profile.social_links?.portfolio,
            
            // Experience, Education, etc.
            Experience: profile.experience?.map((exp: any) => ({
              Company: exp.company,
              Role: exp.position,
              Duration: exp.duration,
              Description: exp.description,
            })),
            Education: profile.education?.map((edu: any) => ({
              Degree: edu.degree,
              University: edu.institution,
              Year: edu.Year || edu.year,
            })),
            Certifications: profile.certifications,
            Projects: profile.projects?.map((proj: any) => ({
              Name: proj.name,
              Description: proj.description,
              Technologies: proj.technologies,
            })),
          };
          setParsedData(formattedData);
          setEditedData(formattedData);
          
          // Add to uploaded files if resume exists
          if (profile.resume_url && profile.resume_filename) {
            setUploadedFiles([{
              url: profile.resume_url,
              name: profile.resume_filename,
              uploadDate: profile.updated_at || new Date().toISOString()
            }]);
          }
        } else {
          // Initialize with basic user data from Clerk if no profile exists
          initializeBasicProfile();
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 404) {
        console.log("No profile found, initializing basic profile");
        initializeBasicProfile();
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const initializeBasicProfile = () => {
    if (user) {
      const basicData: ParsedResumeData = {
        "First Name": user.firstName || "",
        "Last Name": user.lastName || "",
        "Full Name": user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "",
        Email: user.primaryEmailAddress?.emailAddress || "",
        Role: "job_seeker",
        Skills: [],
        Education: [],
        Experience: [],
        Projects: [],
        Certifications: [],
      };
      setParsedData(basicData);
      setEditedData(basicData);
    }
  };

  // Save/Update user profile to backend
  const saveProfileToBackend = async (profileData: ParsedResumeData) => {
    if (!userId) return false;

    try {
      console.log("Saving profile to backend:", profileData);

      const updatedProfile = {
        clerk_id: userId,
        // Personal Info
        first_name: profileData["First Name"],
        last_name: profileData["Last Name"],
        full_name: profileData["Full Name"],
        email: profileData.Email,
        phone: profileData["Phone Number"],
        location: profileData.Location,
        willing_to_relocate: profileData["Willing to relocate"],
        
        // Professional Info
        role: profileData.Role,
        current_company: profileData["Company details"],
        resume_filename: profileData["Resume file"],
        resume_url: profileData["Resume URL"],
        
        // Skills
        technical_skills: profileData["Technical Skills"],
        soft_skills: profileData["Soft Skills"],
        skills: profileData.Skills,
        
        // Social Links
        social_links: {
          linkedin: profileData["LinkedIn Profile"],
          github: profileData["GitHub Profile"],
          portfolio: profileData["Portfolio URL"]
        },
        
        // Experience, Education, etc.
        experience: profileData.Experience?.map(exp => ({
          company: exp.Company,
          position: exp.Role,
          duration: exp.Duration,
          description: exp.Description
        })),
        education: profileData.Education?.map(edu => ({
          degree: edu.Degree,
          institution: edu.University,
          year: edu.Year
        })),
        certifications: profileData.Certifications,
        projects: profileData.Projects?.map(proj => ({
          name: proj.Name,
          description: proj.Description,
          technologies: proj.Technologies
        }))
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/users/update-profile`,
        updatedProfile,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        console.log("Profile saved successfully:", response.data);
        return true;
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      throw error;
    }
  };

  // Set clerkId and fetch profile
  useEffect(() => {
    if (userId) {
      setClerkId(userId);
      if (!isNew) {
        fetchUserProfile();
      } else {
        initializeBasicProfile();
      }
    }
  }, [userId, user, isNew]);

  // Update editedData when parsedData changes
  useEffect(() => {
    if (parsedData) {
      setEditedData({ ...parsedData });
    }
  }, [parsedData]);

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  // Check if services are properly configured
  const isProperlyConfigured = () => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("Cloudinary configuration missing!");
      showAlert(
        "Configuration Error", 
        "Cloudinary configuration is missing. Please set up your environment variables."
      );
      return false;
    }
    return true;
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async (file: any) => {
    try {
      if (!isProperlyConfigured()) {
        throw new Error("Cloudinary not configured");
      }

      console.log('Starting Cloudinary upload...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        uri: file.uri
      });

      const formData = new FormData();
      
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/pdf",
        name: file.name,
      } as any);
      
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);
      formData.append("resource_type", "auto");
      formData.append("folder", "jobswipe/resumes");
      formData.append("tags", "resume,jobswipe,job_seeker");
      
      if (userId) {
        formData.append("context", `user_id=${userId}|upload_date=${new Date().toISOString()}`);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload error:', errorText);
        
        let errorMessage = "Failed to upload to Cloudinary";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Cloudinary error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('Cloudinary upload successful:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        resource_type: result.resource_type,
        bytes: result.bytes
      });

      return result.secure_url;
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      
      let errorMessage = "Failed to upload to Cloudinary";
      
      if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
        errorMessage = "Upload preset configuration error. Please check your Cloudinary settings.";
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Upload timeout. Please try again.";
      } else if (error.message?.includes('file size') || error.message?.includes('too large')) {
        errorMessage = "File is too large. Please select a smaller file.";
      } else if (error.message && error.message !== "Failed to upload to Cloudinary") {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (file.size && file.size > 5 * 1024 * 1024) {
          showAlert("File too large", "Please select a file smaller than 5MB");
          return;
        }

        setSelectedFile(file);
      }
    } catch (error) {
      console.log(error);
      showAlert("Error", "Failed to pick document");
    }
  };

  // Updated handleUpload function
  const handleUpload = async () => {
    if (!selectedFile || !clerkId) {
      showAlert(
        "Missing Information",
        "Please select a file"
      );
      return;
    }

    if (!isProperlyConfigured()) {
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload to Cloudinary
      console.log("Step 1: Uploading to Cloudinary...");
      const cloudinaryUrl = await uploadToCloudinary(selectedFile);
      console.log("Cloudinary URL:", cloudinaryUrl);

      // Step 2: Create FormData for backend
      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || "application/pdf",
        name: selectedFile.name,
      } as any);
      formData.append("clerk_id", clerkId);
      formData.append("user_role", "job_seeker");
      formData.append("resume_url", cloudinaryUrl);

      // Step 3: Send to backend for parsing
      const response = await fetch(
        `${API_BASE_URL}/api/users/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed");

      if (data) {
        setParsedData(data);
        setEditedData(data);
        console.log("Parsed data from upload:", data);
        
        // Add to uploaded files list
        const newUploadedFile = {
          url: cloudinaryUrl,
          name: selectedFile.name,
          uploadDate: new Date().toLocaleString()
        };
        setUploadedFiles(prev => [newUploadedFile, ...prev]);
      }

      // Refresh user profile
      await fetchUserProfile();
      
      showAlert("Success", "Resume uploaded and parsed successfully!");
      setSelectedFile(null);
      
    } catch (error: any) {
      console.error("Upload/Parse error:", error);
      showAlert("Upload Error", error.message || "Failed to upload and parse resume");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle saving edited data
  const handleSaveChanges = async () => {
    if (!editedData || !userId) {
      showAlert("Error", "No data to save");
      return;
    }

    setIsSaving(true);

    try {
      await saveProfileToBackend(editedData);
      setParsedData(editedData);
      setIsEditing(false);
      showAlert("Success", "Profile updated successfully!");
      await fetchUserProfile();
    } catch (error: any) {
      console.error("Save error:", error);
      showAlert("Error", error.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedData(parsedData ? { ...parsedData } : null);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("../components/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper functions for editing
  const updateBasicInfo = (field: string, value: string | boolean) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      [field]: value
    });
  };

  const updateSkill = (index: number, value: string) => {
    if (!editedData || !editedData.Skills) return;
    const updatedSkills = [...editedData.Skills];
    updatedSkills[index] = value;
    setEditedData({
      ...editedData,
      Skills: updatedSkills
    });
  };

  const addSkill = () => {
    if (!editedData) return;
    const updatedSkills = editedData.Skills ? [...editedData.Skills, ""] : [""];
    setEditedData({
      ...editedData,
      Skills: updatedSkills
    });
  };

  const removeSkill = (index: number) => {
    if (!editedData || !editedData.Skills) return;
    const updatedSkills = editedData.Skills.filter((_, i) => i !== index);
    setEditedData({
      ...editedData,
      Skills: updatedSkills
    });
  };

  // Education management functions
  const updateEducation = (index: number, field: string, value: string) => {
    if (!editedData || !editedData.Education) return;
    const updatedEducation = [...editedData.Education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    setEditedData({
      ...editedData,
      Education: updatedEducation
    });
  };

  const addEducation = () => {
    if (!editedData) return;
    const newEducation = {
      Degree: "",
      University: "",
      Year: ""
    };
    const updatedEducation = editedData.Education ? [...editedData.Education, newEducation] : [newEducation];
    setEditedData({
      ...editedData,
      Education: updatedEducation
    });
  };

  const removeEducation = (index: number) => {
    if (!editedData || !editedData.Education) return;
    const updatedEducation = editedData.Education.filter((_, i) => i !== index);
    setEditedData({
      ...editedData,
      Education: updatedEducation
    });
  };

  // Render functions
  const renderEditableSkills = () => {
    if (!editedData?.Skills) return null;
    
    return (
      <View style={styles.editableSkillsContainer}>
        {editedData.Skills.map((skill, index) => (
          <View key={index} style={styles.editableSkillItem}>
            <TextInput
              style={styles.skillInput}
              value={skill}
              onChangeText={(text) => updateSkill(index, text)}
              placeholder="Enter skill"
            />
            <TouchableOpacity
              onPress={() => removeSkill(index)}
              style={styles.removeSkillButton}
            >
              <Ionicons name="close-circle" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={addSkill} style={styles.addSkillButton}>
          <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
          <Text style={styles.addSkillText}>Add Skill</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEditableEducation = () => {
    if (!editedData?.Education) return null;
    
    return (
      <View style={styles.editableEducationContainer}>
        {editedData.Education.map((education, index) => (
          <View key={index} style={styles.editableEducationItem}>
            <View style={styles.educationHeader}>
              <Text style={styles.educationTitle}>Education {index + 1}</Text>
              <TouchableOpacity
                onPress={() => removeEducation(index)}
                style={styles.removeEducationButton}
              >
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.educationInput}
              value={education.Degree}
              onChangeText={(text) => updateEducation(index, 'Degree', text)}
              placeholder="Degree (e.g., Bachelor of Science)"
            />
            <TextInput
              style={styles.educationInput}
              value={education.University}
              onChangeText={(text) => updateEducation(index, 'University', text)}
              placeholder="University/Institution"
            />
            <TextInput
              style={styles.educationInput}
              value={education.Year}
              onChangeText={(text) => updateEducation(index, 'Year', text)}
              placeholder="Year (e.g., 2020-2024)"
            />
          </View>
        ))}
        <TouchableOpacity onPress={addEducation} style={styles.addEducationButton}>
          <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
          <Text style={styles.addEducationText}>Add Education</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEditableBasicInfo = () => {
    if (!editedData) return null;

    return (
      <View style={styles.editableSection}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={editedData["First Name"] || ""}
              onChangeText={(text) => updateBasicInfo("First Name", text)}
              placeholder="Enter first name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={editedData["Last Name"] || ""}
              onChangeText={(text) => updateBasicInfo("Last Name", text)}
              placeholder="Enter last name"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            value={editedData.Email || ""}
            onChangeText={(text) => updateBasicInfo("Email", text)}
            placeholder="Enter email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={editedData["Phone Number"] || ""}
              onChangeText={(text) => updateBasicInfo("Phone Number", text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={editedData.Location || ""}
              onChangeText={(text) => updateBasicInfo("Location", text)}
              placeholder="Enter location"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Role</Text>
          <TextInput
            style={styles.textInput}
            value={editedData.Role || ""}
            onChangeText={(text) => updateBasicInfo("Role", text)}
            placeholder="Enter current role"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Company</Text>
          <TextInput
            style={styles.textInput}
            value={editedData["Company details"] || ""}
            onChangeText={(text) => updateBasicInfo("Company details", text)}
            placeholder="Enter current company"
          />
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => updateBasicInfo("Willing to relocate", !editedData["Willing to relocate"])}
          >
            <Ionicons
              name={editedData["Willing to relocate"] ? "checkbox" : "square-outline"}
              size={20}
              color={editedData["Willing to relocate"] ? "#2563eb" : "#9ca3af"}
            />
            <Text style={styles.checkboxLabel}>Willing to relocate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEducationSection = () => {
    if (!parsedData?.Education || parsedData.Education.length === 0) {
      return null;
    }

    return (
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.educationList}>
          {parsedData.Education.map((education, index) => (
            <View key={index} style={styles.educationItem}>
              <Text style={styles.educationDegree}>{education.Degree}</Text>
              <Text style={styles.educationUniversity}>{education.University}</Text>
              <Text style={styles.educationYear}>{education.Year}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const isUploadDisabled = !selectedFile || !userId || isUploading || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET;

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.profileIconContainer}>
                <Ionicons name="person-circle-outline" size={32} color="#2563eb" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.mainTitle}>Job Seeker Profile</Text>
                <Text style={styles.welcomeText}>Welcome back, {user?.firstName || 'User'}!</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Configuration Warning */}
        {(!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.warningTitle}>Configuration Required</Text>
            </View>
            <Text style={styles.warningText}>
              Please configure your environment variables:
              {'\n'}• EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
              {'\n'}• EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
              {'\n'}• EXPO_PUBLIC_API_URL (required for production)
              {'\n'}
              {'\n'}Currently using: {getEnvironmentInfo().environment}
              {'\n'}API Endpoint: {API_BASE_URL}
            </Text>
          </View>
        )}

        {/* Optional: Development Environment Info */}
        {isUsingLocalhost() && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#2563eb" />
              <Text style={styles.infoTitle}>Development Mode</Text>
            </View>
            <Text style={styles.infoText}>
              You're currently using localhost. For production deployment, set EXPO_PUBLIC_API_URL to your production server URL.
            </Text>
          </View>
        )}

        {/* Professional Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>Professional Profile</Text>
            {parsedData && (
              <View style={styles.cardHeaderActions}>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={[styles.actionButton, styles.cancelButton]}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveChanges}
                      style={[styles.actionButton, styles.saveButton]}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={16} color="#ffffff" />
                          <Text style={styles.saveButtonText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={[styles.actionButton, styles.editButton]}
                  >
                    <Ionicons name="pencil" size={16} color="#2563eb" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <Text style={styles.cardDescription}>
            {parsedData 
              ? "Your professional information parsed from your resume" 
              : "Upload a resume to automatically extract and build your professional profile"
            }
          </Text>

          {parsedData ? (
            <View style={styles.parsedDataContainer}>
              {!isEditing && (
                <View style={styles.successIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.successText}>
                    Profile data available
                  </Text>
                </View>
              )}

              {/* Personal Information */}
              <View style={styles.dataSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                {isEditing ? (
                  renderEditableBasicInfo()
                ) : (
                  <View style={styles.infoContainer}>
                    <Text style={styles.dataText}>
                      Name: {parsedData["Full Name"] || [parsedData["First Name"], parsedData["Last Name"]].filter(Boolean).join(" ") || "Not provided"}
                    </Text>
                    <Text style={styles.dataText}>
                      Email: {parsedData.Email || "Not provided"}
                    </Text>
                    <Text style={styles.dataText}>
                      Phone: {parsedData["Phone Number"] || "Not provided"}
                    </Text>
                    {parsedData.Location && (
                      <Text style={styles.dataText}>Location: {parsedData.Location}</Text>
                    )}
                    {parsedData.Role && (
                      <Text style={styles.dataText}>Role: {parsedData.Role}</Text>
                    )}
                    {parsedData["Company details"] && (
                      <Text style={styles.dataText}>Company: {parsedData["Company details"]}</Text>
                    )}
                    <Text style={styles.dataText}>
                      Willing to relocate: {parsedData["Willing to relocate"] !== undefined ? (parsedData["Willing to relocate"] ? "Yes" : "No") : "Not specified"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Resume File Info */}
              {parsedData["Resume file"] && (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Resume Information</Text>
                  <View style={styles.infoContainer}>
                    <Text style={styles.dataText}>File: {parsedData["Resume file"]}</Text>
                    {parsedData["Resume URL"] && (
                      <TouchableOpacity 
                        onPress={() => openResume(parsedData["Resume URL"]!)}
                        style={styles.resumeLinkButton}
                      >
                        <Ionicons name="document-text-outline" size={16} color="#2563eb" />
                        <Text style={styles.resumeLinkText}>View Resume</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Skills Section */}
              {(isEditing || (parsedData.Skills && parsedData.Skills.length > 0)) && (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Skills</Text>
                  {isEditing ? (
                    <View>
                      {renderEditableSkills()}
                      {!editedData?.Skills?.length && (
                        <TouchableOpacity onPress={addSkill} style={styles.addSkillButton}>
                          <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
                          <Text style={styles.addSkillText}>Add Your First Skill</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={styles.skillsContainer}>
                      {parsedData.Skills?.map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Education Section */}
              {isEditing ? (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Education</Text>
                  {renderEditableEducation()}
                  {!editedData?.Education?.length && (
                    <TouchableOpacity onPress={addEducation} style={styles.addEducationButton}>
                      <Ionicons name="add-circle-outline" size={16} color="#2563eb" />
                      <Text style={styles.addEducationText}>Add Your First Education</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                renderEducationSection()
              )}

              {/* Experience Section - Read Only Display */}
              {parsedData.Experience && parsedData.Experience.length > 0 && (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Work Experience</Text>
                  <View style={styles.experienceList}>
                    {parsedData.Experience.map((exp, index) => (
                      <View key={index} style={styles.experienceItem}>
                        <Text style={styles.experienceRole}>{exp.Role}</Text>
                        <Text style={styles.experienceCompany}>{exp.Company}</Text>
                        <Text style={styles.experienceDuration}>{exp.Duration}</Text>
                        {exp.Description && (
                          <Text style={styles.experienceDescription}>{exp.Description}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Projects Section - Read Only Display */}
              {parsedData.Projects && parsedData.Projects.length > 0 && (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Projects</Text>
                  <View style={styles.projectsList}>
                    {parsedData.Projects.map((project, index) => (
                      <View key={index} style={styles.projectItem}>
                        <Text style={styles.projectName}>{project.Name}</Text>
                        <Text style={styles.projectDescription}>{project.Description}</Text>
                        {project.Technologies && (
                          <View style={styles.technologiesContainer}>
                            {project.Technologies.map((tech, techIndex) => (
                              <View key={techIndex} style={styles.technologyTag}>
                                <Text style={styles.technologyText}>{tech}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Certifications Section - Read Only Display */}
              {parsedData.Certifications && parsedData.Certifications.length > 0 && (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Certifications</Text>
                  <View style={styles.certificationsList}>
                    {parsedData.Certifications.map((cert, index) => (
                      <View key={index} style={styles.certificationItem}>
                        <Ionicons name="ribbon-outline" size={16} color="#2563eb" />
                        <Text style={styles.certificationText}>{cert}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Social Links Section */}
              {(parsedData["LinkedIn Profile"] || parsedData["GitHub Profile"] || parsedData["Portfolio URL"]) && (
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Professional Links</Text>
                  <View style={styles.socialLinksContainer}>
                    {parsedData["LinkedIn Profile"] && (
                      <TouchableOpacity 
                        onPress={() => openResume(parsedData["LinkedIn Profile"]!)}
                        style={styles.socialLink}
                      >
                        <Ionicons name="logo-linkedin" size={16} color="#0077b5" />
                        <Text style={styles.socialLinkText}>LinkedIn Profile</Text>
                        <Ionicons name="open-outline" size={14} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                    {parsedData["GitHub Profile"] && (
                      <TouchableOpacity 
                        onPress={() => openResume(parsedData["GitHub Profile"]!)}
                        style={styles.socialLink}
                      >
                        <Ionicons name="logo-github" size={16} color="#333" />
                        <Text style={styles.socialLinkText}>GitHub Profile</Text>
                        <Ionicons name="open-outline" size={14} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                    {parsedData["Portfolio URL"] && (
                      <TouchableOpacity 
                        onPress={() => openResume(parsedData["Portfolio URL"]!)}
                        style={styles.socialLink}
                      >
                        <Ionicons name="globe-outline" size={16} color="#2563eb" />
                        <Text style={styles.socialLinkText}>Portfolio</Text>
                        <Ionicons name="open-outline" size={14} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyStateText}>
                Upload a resume below to automatically extract your professional information
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Our AI will parse your resume and populate your profile with skills, education, experience, and more
              </Text>
            </View>
          )}
        </View>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="folder-outline" size={20} color="#7c3aed" />
              <Text style={styles.cardTitle}>Uploaded Resumes</Text>
            </View>
            <View style={styles.uploadedFilesList}>
              {uploadedFiles.map((file, index) => (
                <View key={index} style={styles.uploadedFileItem}>
                  <View style={styles.fileIcon}>
                    <Ionicons name="document" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileDate}>Uploaded: {file.uploadDate}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => openResume(file.url)}
                    style={styles.viewButton}
                  >
                    <Ionicons name="eye-outline" size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resume Upload Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud-upload-outline" size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>
              {parsedData?.["Resume file"] ? "Upload New Resume" : "Upload Resume"}
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            {parsedData?.["Resume file"]
              ? "Upload a new resume file to update your profile with latest information"
              : "Select your resume file to upload to secure cloud storage and extract professional data"
            }
          </Text>

          {/* File Upload Area */}
          <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload-outline" size={32} color="#2563eb" />
            </View>
            <Text style={styles.uploadTitle}>
              {parsedData?.["Resume file"] ? "Upload new resume" : "Upload your resume"}
            </Text>
            <Text style={styles.uploadDescription}>
              Tap here to select your resume file for automatic parsing
            </Text>
            <Text style={styles.uploadSubtext}>
              Supports PDF, DOC, DOCX files up to 5MB
            </Text>
            <View style={styles.chooseFileButton}>
              <Text style={styles.chooseFileText}>Choose File</Text>
            </View>

            {selectedFile && (
              <View style={styles.selectedFile}>
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                <Text style={styles.selectedFileSize}>
                  {selectedFile.size
                    ? (selectedFile.size / 1024 / 1024).toFixed(2) + " MB"
                    : "Unknown size"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.uploadButton,
              isUploadDisabled && styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={isUploadDisabled}
          >
            {isUploading ? (
              <View style={styles.uploadButtonContent}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.uploadButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.uploadButtonContent}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={16}
                  color="#ffffff"
                />
                <Text style={styles.uploadButtonText}>
                  Upload & Parse Resume
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Upload Status Information */}
          <View style={styles.uploadStatusContainer}>
            <View style={styles.statusItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
              <Text style={styles.statusText}>Secure cloud storage with Cloudinary</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="bulb-outline" size={16} color="#7c3aed" />
              <Text style={styles.statusText}>AI-powered resume parsing and data extraction</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="server-outline" size={16} color="#2563eb" />
              <Text style={styles.statusText}>Automatic profile updates via backend API</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="lock-closed-outline" size={16} color="#7c3aed" />
              <Text style={styles.statusText}>Your files are encrypted and private</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SeekerProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#dbeafe",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  signOutText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#dc2626",
    marginLeft: 4,
  },
  warningCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d97706",
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2563eb",
  },
  saveButton: {
    backgroundColor: "#059669",
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374751",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  editableSection: {
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374751",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#111827",
  },
  editableSkillsContainer: {
    gap: 8,
  },
  editableSkillItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#ffffff",
    fontSize: 12,
  },
  removeSkillButton: {
    padding: 4,
  },
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    gap: 4,
    marginTop: 4,
  },
  addSkillText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
  editableEducationContainer: {
    gap: 16,
  },
  editableEducationItem: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  educationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374751",
  },
  removeEducationButton: {
    padding: 4,
  },
  educationInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
    marginBottom: 8,
  },
  addEducationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    gap: 6,
  },
  addEducationText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  uploadIcon: {
    width: 64,
    height: 64,
    backgroundColor: "#dbeafe",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 16,
  },
  chooseFileButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chooseFileText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374751",
  },
  selectedFile: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#065f46",
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 12,
    color: "#059669",
  },
  uploadButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  uploadButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  uploadStatusContainer: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
  },
  infoContainer: {
    gap: 6,
  },
  parsedDataContainer: {
    // Remove maxHeight to show all content
  },
  successIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#059669",
    marginLeft: 8,
  },
  dataSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  dataText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    color: "#1e40af",
    fontWeight: "500",
  },
  educationList: {
    gap: 12,
  },
  educationItem: {
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },
  educationDegree: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  educationUniversity: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  educationYear: {
    fontSize: 12,
    color: "#9ca3af",
  },
  experienceList: {
    gap: 16,
  },
  experienceItem: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  experienceRole: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
    marginBottom: 4,
  },
  experienceDuration: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  experienceDescription: {
    fontSize: 14,
    color: "#374751",
    lineHeight: 20,
  },
  projectsList: {
    gap: 12,
  },
  projectItem: {
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
  },
  projectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  technologiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  technologyTag: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  technologyText: {
    fontSize: 10,
    color: "#6d28d9",
    fontWeight: "500",
  },
  certificationsList: {
    gap: 8,
  },
  certificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    gap: 8,
  },
  certificationText: {
    fontSize: 14,
    color: "#374751",
    flex: 1,
  },
  socialLinksContainer: {
    gap: 8,
  },
  socialLink: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  socialLinkText: {
    fontSize: 14,
    color: "#374751",
    flex: 1,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374751",
  },
  resumeLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  resumeLinkText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  uploadedFilesList: {
    gap: 12,
  },
  uploadedFileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  fileIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  viewButton: {
    padding: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
  },
});