import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

// Types
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchPercentage: number;
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  postedTime: string;
  companySize: string;
  experience: string;
}

// Export interfaces and types
export interface JobSwipeCardProps {
  job: Job;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onBookmark: () => void;
  isTop: boolean;
  isSaved: boolean;
}

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

export default function SeekerJobs() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [showOverlay, setShowOverlay] = useState(true);
  
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  
  const locations = [
    'All Locations',
    'Live Location',
    'Remote',
    'San Francisco, CA',
    'New York, NY',
    'Austin, TX',
    'Seattle, WA',
    'Los Angeles, CA',
    'Chicago, IL',
    'Boston, MA',
    'Denver, CO'
  ];

  const overlayOpacity = useSharedValue(1);
  const leftArrowTranslateX = useSharedValue(0);
  const rightArrowTranslateX = useSharedValue(0);
  const leftArrowOpacity = useSharedValue(1);
  const rightArrowOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);

  const leftTutorialOpacity = useSharedValue(0);
  const rightTutorialOpacity = useSharedValue(0);

  const leftScreenOpacity = useSharedValue(0);
  const rightScreenOpacity = useSharedValue(0);
  const leftScreenScale = useSharedValue(0.8);
  const rightScreenScale = useSharedValue(0.8);

  const fallbackJobsData: Job[] = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp Industries",
      location: "Remote / San Francisco, CA",
      salary: "$120k - $160k",
      matchPercentage: 95,
      type: "Full-time",
      experience: "5+ years",
      companySize: "500-1000 employees",
      description: "Build cutting-edge web applications using React, TypeScript, and modern CSS frameworks. Collaborate with designers and product teams to deliver exceptional user experiences while mentoring junior developers.",
      requirements: [
        "5+ years of frontend development experience",
        "Expert knowledge of React and TypeScript",
        "Experience with modern build tools and CI/CD",
        "Strong understanding of responsive design",
        "Experience with testing frameworks (Jest, Cypress)",
        "Knowledge of accessibility standards"
      ],
      benefits: [
        "Competitive salary + equity",
        "Flexible work arrangements",
        "Health, dental, and vision insurance",
        "401k matching up to 6%",
        "Professional development budget",
        "Unlimited PTO policy"
      ],
      tags: ["React", "TypeScript", "JavaScript", "CSS", "Git", "Agile"],
      postedTime: "2 days ago",
    },
    {
      id: "2",
      title: "Backend Engineering Lead",
      company: "DataFlow Systems",
      location: "New York, NY / Hybrid",
      salary: "$140k - $180k",
      matchPercentage: 88,
      type: "Full-time",
      experience: "7+ years",
      companySize: "200-500 employees",
      description: "Lead engineering team building scalable backend systems handling millions of requests. Work with Node.js, Python, PostgreSQL, and AWS on microservices and distributed systems.",
      requirements: [
        "7+ years of backend development experience",
        "Strong leadership and mentoring skills",
        "Expertise in Node.js, Python, or similar languages",
        "Experience with microservices and distributed systems",
        "Knowledge of database design and optimization",
        "AWS or other cloud platform experience"
      ],
      benefits: [
        "Leadership role with growth opportunities",
        "Stock options and performance bonuses",
        "Comprehensive healthcare coverage",
        "Flexible hybrid work model",
        "Learning and conference budget",
        "Team building activities and events"
      ],
      tags: ["Node.js", "Python", "AWS", "PostgreSQL", "Docker", "Leadership"],
      postedTime: "1 week ago",
    },
    {
      id: "3",
      title: "Mobile App Developer",
      company: "Innovation Labs Inc",
      location: "Austin, TX",
      salary: "$95k - $125k",
      matchPercentage: 92,
      type: "Full-time",
      experience: "4+ years",
      companySize: "50-100 employees",
      description: "Develop mobile apps for millions of users using React Native and native iOS/Android technologies. Work in agile environment with designers and product managers at a fast-growing startup.",
      requirements: [
        "4+ years of mobile development experience",
        "Proficiency in React Native and native development",
        "Experience with iOS and Android platforms",
        "Knowledge of mobile app deployment processes",
        "Understanding of mobile UI/UX best practices",
        "Experience with state management libraries"
      ],
      benefits: [
        "Competitive salary and equity package",
        "Flexible working hours",
        "Health and wellness programs",
        "Professional development opportunities",
        "Modern office with great amenities",
        "Company-sponsored team outings"
      ],
      tags: ["React Native", "iOS", "Android", "Flutter", "Mobile", "JavaScript"],
      postedTime: "3 days ago",
    },
    {
      id: "4",
      title: "DevOps Engineer",
      company: "CloudScale Solutions",
      location: "Seattle, WA / Remote",
      salary: "$110k - $145k",
      matchPercentage: 78,
      type: "Full-time",
      experience: "3+ years",
      companySize: "100-200 employees",
      description: "Scale infrastructure and improve deployments using Kubernetes, Docker, and AWS. Design CI/CD pipelines serving millions of users in a fully remote environment.",
      requirements: [
        "3+ years of DevOps/Infrastructure experience",
        "Strong knowledge of Kubernetes and Docker",
        "Experience with AWS, Azure, or GCP",
        "Proficiency in Infrastructure as Code (Terraform)",
        "Understanding of CI/CD best practices",
        "Monitoring and logging experience"
      ],
      benefits: [
        "Remote-first company culture",
        "Competitive compensation package",
        "Health, dental, vision insurance",
        "Home office setup allowance",
        "Annual learning stipend",
        "Flexible vacation policy"
      ],
      tags: ["DevOps", "Kubernetes", "AWS", "Docker", "Terraform", "CI/CD"],
      postedTime: "2 days ago",
    },
    {
      id: "5",
      title: "Full Stack Developer",
      company: "StartupHub",
      location: "Remote",
      salary: "$85k - $115k",
      matchPercentage: 87,
      type: "Full-time",
      experience: "3+ years",
      companySize: "20-50 employees",
      description: "Build innovative web applications using React and Node.js. Work across the full stack in a dynamic startup solving real-world problems.",
      requirements: [
        "3+ years of full stack development experience",
        "Proficiency in React and Node.js",
        "Experience with databases (PostgreSQL, MongoDB)",
        "Knowledge of cloud platforms",
        "Understanding of agile methodologies"
      ],
      benefits: [
        "100% remote work",
        "Equity participation",
        "Flexible schedule",
        "Health insurance",
        "Professional development budget"
      ],
      tags: ["React", "Node.js", "Full Stack", "Remote", "Startup"],
      postedTime: "1 day ago",
    }
  ];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [swipedJobs, setSwipedJobs] = useState<{ job: Job; action: string }[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const filterJobsByLocation = (location: string, jobsToFilter?: Job[], userLoc?: string) => {
    const jobsData = jobsToFilter || allJobs;
    
    if (location === 'All Locations') {
      setJobs(jobsData);
    } else if (location === 'Live Location' && userLoc) {
      const filteredJobs = jobsData.filter(job => 
        job.location.toLowerCase().includes(userLoc.toLowerCase()) ||
        job.location.toLowerCase().includes('remote')
      );
      setJobs(filteredJobs);
    } else {
      const filteredJobs = jobsData.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase()) ||
        (location === 'Remote' && job.location.toLowerCase().includes('remote'))
      );
      setJobs(filteredJobs);
    }
  };

  useEffect(() => {
    if (showOverlay) {
      overlayOpacity.value = 1;
      leftArrowTranslateX.value = 0;
      rightArrowTranslateX.value = 0;
      
      startOverlayAnimation();
      
      const timer = setTimeout(() => {
        hideOverlay();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showOverlay]);

  const startOverlayAnimation = () => {
    leftTutorialOpacity.value = withTiming(0.4, { duration: 300 });
    rightTutorialOpacity.value = withTiming(0.4, { duration: 300 });
    
    const animateArrows = () => {
      leftArrowTranslateX.value = withSequence(
        withTiming(-40, { duration: 600 }),
        withTiming(0, { duration: 600 })
      );
      rightArrowTranslateX.value = withSequence(
        withTiming(40, { duration: 600 }),
        withTiming(0, { duration: 600 })
      );
    };

    animateArrows();
    
    const intervalId = setInterval(animateArrows, 1200);
    
    setTimeout(() => {
      clearInterval(intervalId);
    }, 2500);
  };

  const hideOverlay = () => {
    leftTutorialOpacity.value = withTiming(0, { duration: 400 });
    rightTutorialOpacity.value = withTiming(0, { duration: 400 });
    overlayOpacity.value = withTiming(0, { duration: 400 }, () => {
      runOnJS(setShowOverlay)(false);
    });
  };

  const triggerHalfScreenAnimation = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      leftScreenOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
      leftScreenScale.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.8, { duration: 300 })
      );
    } else {
      rightScreenOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
      rightScreenScale.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.8, { duration: 300 })
      );
    }
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      setApplications(fallbackJobsData);
      setAllJobs(fallbackJobsData);
      filterJobsByLocation('All Locations', fallbackJobsData);
      
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load job applications. Please check your internet connection or try again later.');
      setApplications(fallbackJobsData);
      setAllJobs(fallbackJobsData);
      filterJobsByLocation('All Locations', fallbackJobsData);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveLocation = async () => {
    try {
      setIsLocationLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find jobs near you');
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      try {
        const reverseGeocodeResult = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverseGeocodeResult && reverseGeocodeResult.length > 0) {
          const result = reverseGeocodeResult[0];
          const city = result.city || result.subregion || 'Unknown City';
          const region = result.region || result.country || '';
          const locationString = region ? `${city}, ${region}` : city;
          
          setUserLocation(locationString);
          setSelectedLocation('Live Location');
          setShowLocationModal(false);
          
          filterJobsByLocation('Live Location', allJobs, locationString);
          
          Alert.alert(
            'Location Found! 📍', 
            `Jobs filtered for: ${locationString}`,
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          throw new Error('No location data returned');
        }
      } catch (geocodingError) {
        console.error('Geocoding error:', geocodingError);
        const locationString = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        setUserLocation(locationString);
        setSelectedLocation('Live Location');
        setShowLocationModal(false);
        filterJobsByLocation('Live Location', allJobs, locationString);
        
        Alert.alert(
          'Location Found! 📍', 
          `Jobs filtered for your location`,
          [{ text: 'Great!', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('Location error:', error);
      let errorMessage = 'Unable to get your location. ';
      
      if (error.code) {
        switch (error.code) {
          case 'E_LOCATION_PERMISSION_DENIED':
            errorMessage += 'Please enable location permissions in settings.';
            break;
          case 'E_LOCATION_UNAVAILABLE':
            errorMessage += 'Location services are unavailable.';
            break;
          case 'E_LOCATION_TIMEOUT':
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please try again or select a location manually.';
            break;
        }
      }
      
      Alert.alert('Location Error', 'Unable to get your location. Please check your permissions and try again.');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    if (location === 'Live Location') {
      fetchLiveLocation();
    } else {
      setSelectedLocation(location);
      setShowLocationModal(false);
      filterJobsByLocation(location, allJobs);
    }
  };

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const retryFetch = () => {
    fetchApplications();
  };

  const handleSwipeLeft = (job: Job) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    triggerHalfScreenAnimation('left');
    
    setTimeout(() => {
      setJobs((prev) => prev.slice(1));
      setSwipedJobs((prev) => [...prev, { job, action: "rejected" }]);
      setIsAnimating(false);
    }, 300);
  };

  const handleSwipeRight = (job: Job) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    triggerHalfScreenAnimation('right');
    
    setTimeout(() => {
      setJobs((prev) => prev.slice(1));
      setSwipedJobs((prev) => [...prev, { job, action: "liked" }]);
      Alert.alert("Job Liked! 💚", `You liked ${job.title} at ${job.company}`, [
        { text: "Great!", style: "default" }
      ]);
      setIsAnimating(false);
    }, 300);
  };

  const handleBookmark = (job: Job) => {
    const isCurrentlySaved = savedJobs.has(job.id);
    
    if (isCurrentlySaved) {
      setSavedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
      Alert.alert("Removed 📝", `${job.title} has been removed from your bookmarks.`);
    } else {
      setSavedJobs(prev => new Set(prev).add(job.id));
      Alert.alert("Bookmarked! 🔖", `${job.title} has been saved to your bookmarks.`);
    }
  };

  const resetJobs = () => {
    const dataToReset = allJobs.length > 0 ? allJobs : fallbackJobsData;
    filterJobsByLocation(selectedLocation, dataToReset);
    setSwipedJobs([]);
    setIsAnimating(false);
    setSavedJobs(new Set());
    setShowOverlay(true);
    overlayOpacity.value = 1;
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const leftArrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftArrowTranslateX.value }],
    opacity: leftArrowOpacity.value,
  }));

  const rightArrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightArrowTranslateX.value }],
    opacity: rightArrowOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const leftTutorialAnimatedStyle = useAnimatedStyle(() => ({
    opacity: leftTutorialOpacity.value,
  }));

  const rightTutorialAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightTutorialOpacity.value,
  }));

  const leftScreenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: leftScreenOpacity.value,
    transform: [{ scale: leftScreenScale.value }],
  }));

  const rightScreenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightScreenOpacity.value,
    transform: [{ scale: rightScreenScale.value }],
  }));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading job opportunities...</Text>
        <View style={styles.loadingSpinner}>
          <Text style={styles.loadingEmoji}>🔄</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}>
      {/* Location Selector - Moved and positioned better */}
      <View style={styles.locationContainer}>
        <TouchableOpacity 
          style={styles.locationSelector} 
          onPress={() => setShowLocationModal(true)}
        >
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedLocation}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {/* REMOVED: Header with "Industrial Jobs" text - completely removed this section */}
      
      {/* MODIFIED: Card container with adjusted positioning - moved higher */}
      <View style={styles.cardContainer}>
        {jobs && jobs.length > 0 ? (
          <>
            {jobs.length > 1 && (
              <View style={[styles.card, styles.backgroundCard]}>
                <JobCardContent job={jobs[1]} />
              </View>
            )}
            <JobSwipeCard
              key={jobs[0]?.id || 'fallback-0'}
              job={jobs[0]}
              isTop={true}
              isSaved={savedJobs.has(jobs[0]?.id || '')}
              onSwipeLeft={() => handleSwipeLeft(jobs[0])}
              onSwipeRight={() => handleSwipeRight(jobs[0])}
              onBookmark={() => handleBookmark(jobs[0])}
              onSwipeAnimation={triggerHalfScreenAnimation}
            />
          </>
        ) : (
          <View style={styles.noJobsContainer}>
            <Text style={styles.noJobsEmoji}>
              {selectedLocation === 'All Locations' ? '🎉' : '📍'}
            </Text>
            <Text style={styles.noJobsTitle}>
              {selectedLocation === 'All Locations' ? 'All done!' : 'No jobs found'}
            </Text>
            <Text style={styles.noJobsSubtitle}>
              {selectedLocation === 'All Locations' 
                ? "You've reviewed all available positions" 
                : selectedLocation === 'Live Location' && userLocation
                ? `No jobs available in ${userLocation} right now`
                : `No jobs available in ${selectedLocation} right now`}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={resetJobs}>
              <Text style={styles.primaryButtonText}>
                {selectedLocation === 'All Locations' ? 'Start Over' : 'Reset & Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Show info messages and reset button at bottom */}
      {(selectedLocation !== 'All Locations' || error || swipedJobs.length > 0) && (
        <View style={styles.bottomInfo}>
          {selectedLocation !== 'All Locations' && (
            <Text style={styles.jobCount}>
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} in {
                selectedLocation === 'Live Location' && userLocation 
                  ? userLocation 
                  : selectedLocation
              }
            </Text>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                <Ionicons name="refresh-outline" size={14} color="#3b82f6" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {swipedJobs.length > 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={resetJobs}>
              <Ionicons name="refresh-outline" size={14} color="#fff" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowLocationModal(false)}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.locationList} showsVerticalScrollIndicator={false}>
              {locations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationItem,
                    selectedLocation === location && styles.selectedLocationItem,
                    location === 'Live Location' && isLocationLoading && styles.loadingLocationItem
                  ]}
                  onPress={() => handleLocationSelect(location)}
                  disabled={location === 'Live Location' && isLocationLoading}
                >
                  {location === 'Live Location' && isLocationLoading ? (
                    <Text style={styles.loadingText}>📍</Text>
                  ) : (
                    <Ionicons 
                      name={location === 'Live Location' ? 'locate-outline' : location === 'Remote' ? 'laptop-outline' : 'location-outline'} 
                      size={18} 
                      color={selectedLocation === location ? '#3b82f6' : '#6b7280'} 
                    />
                  )}
                  <Text style={[
                    styles.locationItemText,
                    selectedLocation === location && styles.selectedLocationText,
                    location === 'Live Location' && isLocationLoading && styles.loadingLocationText
                  ]}>
                    {location === 'Live Location' && userLocation && selectedLocation === 'Live Location'
                      ? `Live Location (${userLocation})`
                      : location === 'Live Location' && isLocationLoading
                      ? 'Getting your location...'
                      : location}
                  </Text>
                  {selectedLocation === location && (
                    <Ionicons name="checkmark" size={18} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Half-screen animation overlays */}
      <Animated.View style={[styles.halfScreenOverlay, styles.leftHalfScreen, leftScreenAnimatedStyle]}>
        <View style={styles.halfScreenContent}>
          <Ionicons name="close-circle" size={80} color="#fff" />
          <Text style={styles.halfScreenText}>REJECT</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.halfScreenOverlay, styles.rightHalfScreen, rightScreenAnimatedStyle]}>
        <View style={styles.halfScreenContent}>
          <Ionicons name="checkmark-circle" size={80} color="#fff" />
          <Text style={styles.halfScreenText}>ACCEPT</Text>
        </View>
      </Animated.View>

      {/* Tutorial Overlay */}
      {showOverlay && (
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={hideOverlay}
          style={[styles.tutorialOverlay, overlayAnimatedStyle]}
        >
          <Animated.View style={[styles.tutorialHalfScreen, styles.leftTutorialHalf, leftTutorialAnimatedStyle]} />
          <Animated.View style={[styles.tutorialHalfScreen, styles.rightTutorialHalf, rightTutorialAnimatedStyle]} />
          
          <View style={styles.tutorialContent}>
            <Animated.View style={[styles.arrowContainer, styles.leftArrow, leftArrowAnimatedStyle]}>
              <Ionicons name="close-circle" size={60} color="#fff" />
              <Text style={styles.arrowLabel}>REJECT</Text>
            </Animated.View>

            <Animated.View style={[styles.arrowContainer, styles.rightArrow, rightArrowAnimatedStyle]}>
              <Ionicons name="checkmark-circle" size={60} color="#fff" />
              <Text style={styles.arrowLabel}>ACCEPT</Text>
            </Animated.View>

            <Animated.View style={[styles.instructionContainer, textAnimatedStyle]}>
              <Text style={styles.instructionText}>Swipe right to accept • Swipe left to reject</Text>
              <Text style={styles.instructionSubtext}>Tap to dismiss tutorial</Text>
            </Animated.View>
          </View>
        </TouchableOpacity>
      )}
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

function JobSwipeCard({ 
  job, 
  onSwipeLeft, 
  onSwipeRight, 
  onBookmark, 
  isTop, 
  isSaved, 
  onSwipeAnimation 
}: JobSwipeCardProps & { onSwipeAnimation: (direction: 'left' | 'right') => void }) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.98);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      rotate.value = interpolate(
        event.translationX,
        [-width, 0, width],
        [-8, 0, 8],
        Extrapolate.CLAMP
      );

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD * 0.6) {
        if (event.translationX > 0) {
          runOnJS(onSwipeAnimation)('right');
        } else {
          runOnJS(onSwipeAnimation)('left');
        }
      }
    },
    onEnd: (event) => {
      scale.value = withSpring(1);
      
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 1.5, 
          { duration: 300 }, 
          (finished) => {
            if (finished) {
              runOnJS(onSwipeRight)();
              translateX.value = 0;
              rotate.value = 0;
            }
          }
        );
        rotate.value = withTiming(8, { duration: 300 });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 1.5, 
          { duration: 300 }, 
          (finished) => {
            if (finished) {
              runOnJS(onSwipeLeft)();
              translateX.value = 0;
              rotate.value = 0;
            }
          }
        );
        rotate.value = withTiming(-8, { duration: 300 });
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD, width],
      [1, 0.9, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity,
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const rejectOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <JobCardContent job={job} />
        
        <Animated.View style={[styles.likeOverlay, likeOverlayStyle]}>
          <View style={[styles.overlayContent, styles.likeOverlayContent]}>
            <Ionicons name="heart" size={24} color="#22c55e" />
            <Text style={[styles.overlayText, styles.likeOverlayText]}>LIKE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.rejectOverlay, rejectOverlayStyle]}>
          <View style={[styles.overlayContent, styles.rejectOverlayContent]}>
            <Ionicons name="close" size={24} color="#ef4444" />
            <Text style={[styles.overlayText, styles.rejectOverlayText]}>PASS</Text>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={onSwipeLeft}
          >
            <Ionicons name="close" size={20} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.bookmarkButton, isSaved && styles.bookmarkButtonActive]}
            onPress={onBookmark}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={16} 
              color={isSaved ? "#3b82f6" : "#6b7280"} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={onSwipeRight}
          >
            <Ionicons name="heart" size={20} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

function JobCardContent({ job }: { job: Job }) {
  if (!job) {
    return (
      <View style={styles.cardContent}>
        <Text style={styles.errorText}>Job data unavailable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardHeader}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{job.company?.charAt(0) || 'N'}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.company}>{job.company || 'Unknown Company'}</Text>
          <Text style={styles.companySizeText}>{job.companySize || 'Company size not specified'}</Text>
          <Text style={styles.experienceText}>{job.type || 'Full-time'} • {job.experience || 'Experience not specified'}</Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>{job.matchPercentage || 0}%</Text>
        </View>
      </View>

      <Text style={styles.title}>{job.title || 'Job Title Not Available'}</Text>

      {/* Job Details Row */}
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailItem}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.jobDetailText}>{job.location || 'Location not specified'}</Text>
        </View>
        <View style={styles.jobDetailItem}>
          <Ionicons name="cash-outline" size={14} color="#6b7280" />
          <Text style={styles.jobDetailText}>{job.salary || 'Salary not specified'}</Text>
        </View>
        <View style={styles.jobDetailItem}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.jobDetailText}>{job.postedTime || 'Recently posted'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About the Role</Text>
        <Text style={styles.description}>{job.description || 'Job description not available at this time.'}</Text>
      </View>

      {job.requirements && job.requirements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <Text style={styles.requirementBullet}>•</Text>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
      )}

      {job.tags && job.tags.length > 0 && (
        <View style={styles.tags}>
          {job.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={{ height: 70 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Location selector positioned at top
  locationContainer: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 100,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: 140,
  },
  locationText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
    marginHorizontal: 4,
    flex: 1,
  },
  // Moved info to bottom, more space for cards
  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  jobCount: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  // MODIFIED: Card container moved higher with adjusted top padding
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 30, // Reduced from original padding since header is removed
    paddingBottom: 90, // Space for bottom info
  },
  noJobsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  noJobsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noJobsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
  },
  noJobsSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Card size optimized for better content display
  card: {
    width: width * 0.88,
    height: height * 0.75,
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  backgroundCard: {
    transform: [{ scale: 0.94 }],
    opacity: 0.3,
    zIndex: 0,
  },
  // Optimized content padding
  cardContent: {
    flex: 1,
    padding: 18,
  },
  likeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  rejectOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  overlayContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    gap: 6,
  },
  likeOverlayContent: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  rejectOverlayContent: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  likeOverlayText: {
    color: '#22c55e',
  },
  rejectOverlayText: {
    color: '#ef4444',
  },
  // Reduced font sizes and spacing
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoText: {
    fontWeight: "800",
    fontSize: 18,
    color: "#1e3a8a",
  },
  companyInfo: {
    flex: 1,
  },
  company: {
    fontWeight: "600",
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 2,
  },
  companySizeText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  experienceText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  matchBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  matchText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22c55e",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1f2937",
    lineHeight: 26,
  },
  // Job details row styles
  jobDetails: {
    marginBottom: 16,
    gap: 8,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobDetailText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 19,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  requirementBullet: {
    fontSize: 14,
    color: "#3b82f6",
    marginRight: 8,
    marginTop: 1,
  },
  requirementText: {
    fontSize: 12,
    color: "#4b5563",
    lineHeight: 18,
    flex: 1,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#e0e7ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  tagText: {
    fontSize: 10,
    color: "#3730a3",
    fontWeight: "600",
  },
  // Reduced action button sizes
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1.5,
    borderColor: "#fecaca",
  },
  bookmarkButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  bookmarkButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
  },
  likeButton: {
    backgroundColor: "#dcfce7",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#cbd5e1",
    marginBottom: 12,
    textAlign: "center",
  },
  loadingSpinner: {
    padding: 12,
  },
  loadingEmoji: {
    fontSize: 28,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
  },
  errorText: {
    fontSize: 11,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 6,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  retryButtonText: {
    color: "#3b82f6",
    fontSize: 10,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  locationModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.85,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  locationList: {
    maxHeight: height * 0.4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  selectedLocationItem: {
    backgroundColor: '#f0f9ff',
  },
  locationItemText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  selectedLocationText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  loadingLocationItem: {
    opacity: 0.6,
  },
  loadingLocationText: {
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  // Half-screen animation styles
  halfScreenOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  leftHalfScreen: {
    left: 0,
    width: width / 2,
    backgroundColor: '#ef4444',
  },
  rightHalfScreen: {
    right: 0,
    width: width / 2,
    backgroundColor: '#22c55e',
  },
  halfScreenContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfScreenText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // Tutorial Overlay Styles
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tutorialContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
    height: '100%',
  },
  tutorialHalfScreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width / 2,
    zIndex: 1,
  },
  leftTutorialHalf: {
    left: 0,
    backgroundColor: '#ef4444',
  },
  rightTutorialHalf: {
    right: 0,
    backgroundColor: '#22c55e',
  },
  arrowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  leftArrow: {
    left: width * 0.15,
    top: '42%',
  },
  rightArrow: {
    right: width * 0.15,
    top: '42%',
  },
  arrowLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  instructionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  instructionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});