import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Add your API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Application {
  id: string;
  company_name: string;
  position_title: string;
  application_type: 'internship' | 'job';
  application_date: string;
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'rejected' | 'accepted';
  keyword_match_percentage: number;
  matched_keywords: string[];
  total_keywords: number;
  job_description: string;
  application_platform: string;
  notes?: string;
  interview_date?: string;
  salary_range?: string;
  location: string;
  remote_option: boolean;
  tracking_history: TrackingEvent[];
}

interface TrackingEvent {
  id: string;
  date: string;
  status: string;
  description: string;
  type: 'status_change' | 'communication' | 'interview' | 'follow_up' | 'offer';
}

// Static sample data
const SAMPLE_APPLICATIONS: Application[] = [
  {
    id: '1',
    company_name: 'Google',
    position_title: 'Software Engineering Intern',
    application_type: 'internship',
    application_date: '2024-12-15',
    status: 'interview_scheduled',
    keyword_match_percentage: 92,
    matched_keywords: ['React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning', 'Git'],
    total_keywords: 8,
    job_description: 'Looking for passionate software engineering interns to join our team...',
    application_platform: 'Google Careers',
    notes: 'Applied through university career fair contact',
    interview_date: '2024-12-20',
    salary_range: '$8,000 - $10,000/month',
    location: 'Mountain View, CA',
    remote_option: true,
    tracking_history: [
      {
        id: '1-1',
        date: '2024-12-15',
        status: 'Applied',
        description: 'Application submitted successfully',
        type: 'status_change'
      },
      {
        id: '1-2',
        date: '2024-12-17',
        status: 'Under Review',
        description: 'Application is being reviewed by hiring team',
        type: 'status_change'
      },
      {
        id: '1-3',
        date: '2024-12-18',
        status: 'Interview Scheduled',
        description: 'Phone screening scheduled for Dec 20, 2024',
        type: 'interview'
      }
    ]
  },
  {
    id: '2',
    company_name: 'Microsoft',
    position_title: 'Full Stack Developer',
    application_type: 'job',
    application_date: '2024-12-10',
    status: 'under_review',
    keyword_match_percentage: 85,
    matched_keywords: ['React', 'Azure', 'C#', '.NET', 'SQL Server'],
    total_keywords: 7,
    job_description: 'Join our dynamic team working on cloud solutions...',
    application_platform: 'LinkedIn',
    salary_range: '$120,000 - $150,000',
    location: 'Seattle, WA',
    remote_option: true,
    tracking_history: [
      {
        id: '2-1',
        date: '2024-12-10',
        status: 'Applied',
        description: 'Application submitted via LinkedIn',
        type: 'status_change'
      },
      {
        id: '2-2',
        date: '2024-12-12',
        status: 'Under Review',
        description: 'Recruiter viewed profile and application',
        type: 'status_change'
      }
    ]
  },
  {
    id: '3',
    company_name: 'Tesla',
    position_title: 'Software Engineering Intern',
    application_type: 'internship',
    application_date: '2024-12-08',
    status: 'applied',
    keyword_match_percentage: 78,
    matched_keywords: ['Python', 'Django', 'PostgreSQL', 'AWS'],
    total_keywords: 6,
    job_description: 'Work on cutting-edge automotive software...',
    application_platform: 'Tesla Careers',
    location: 'Palo Alto, CA',
    remote_option: false,
    tracking_history: [
      {
        id: '3-1',
        date: '2024-12-08',
        status: 'Applied',
        description: 'Application submitted through Tesla careers portal',
        type: 'status_change'
      }
    ]
  },
  {
    id: '4',
    company_name: 'Spotify',
    position_title: 'Data Science Intern',
    application_type: 'internship',
    application_date: '2024-12-05',
    status: 'rejected',
    keyword_match_percentage: 65,
    matched_keywords: ['Python', 'Machine Learning', 'SQL'],
    total_keywords: 8,
    job_description: 'Analyze user behavior and improve recommendation algorithms...',
    application_platform: 'Indeed',
    location: 'New York, NY',
    remote_option: true,
    tracking_history: [
      {
        id: '4-1',
        date: '2024-12-05',
        status: 'Applied',
        description: 'Application submitted through Indeed',
        type: 'status_change'
      },
      {
        id: '4-2',
        date: '2024-12-07',
        status: 'Under Review',
        description: 'Application reviewed by HR team',
        type: 'status_change'
      },
      {
        id: '4-3',
        date: '2024-12-12',
        status: 'Rejected',
        description: 'Position filled by another candidate',
        type: 'status_change'
      }
    ]
  },
  {
    id: '5',
    company_name: 'Apple',
    position_title: 'iOS Developer',
    application_type: 'job',
    application_date: '2024-12-01',
    status: 'accepted',
    keyword_match_percentage: 95,
    matched_keywords: ['Swift', 'iOS', 'UIKit', 'SwiftUI', 'Core Data', 'Xcode'],
    total_keywords: 6,
    job_description: 'Develop innovative iOS applications for millions of users...',
    application_platform: 'Apple Jobs',
    salary_range: '$140,000 - $180,000',
    location: 'Cupertino, CA',
    remote_option: false,
    tracking_history: [
      {
        id: '5-1',
        date: '2024-12-01',
        status: 'Applied',
        description: 'Application submitted through Apple careers',
        type: 'status_change'
      },
      {
        id: '5-2',
        date: '2024-12-03',
        status: 'Under Review',
        description: 'Technical screening completed',
        type: 'status_change'
      },
      {
        id: '5-3',
        date: '2024-12-08',
        status: 'Interview Scheduled',
        description: 'On-site interviews scheduled',
        type: 'interview'
      },
      {
        id: '5-4',
        date: '2024-12-14',
        status: 'Accepted',
        description: 'Offer received and accepted! Start date: Jan 15, 2025',
        type: 'offer'
      }
    ]
  }
];

const ApplicationsIndex = () => {
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(SAMPLE_APPLICATIONS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'internship' | 'job'>('all');
  const [sortBy, setSortBy] = useState<'percentage' | 'date' | 'company'>('date');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [newTrackingNote, setNewTrackingNote] = useState('');
  
  // New dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchApplications();
    }, 1000);
  }, [filter, sortBy]);

  const fetchApplications = async () => {
    try {
      let filteredApps = SAMPLE_APPLICATIONS;
      
      if (filter !== 'all') {
        filteredApps = filteredApps.filter(app => app.application_type === filter);
      }

      const sortedData = filteredApps.sort((a: Application, b: Application) => {
        if (sortBy === 'percentage') {
          return b.keyword_match_percentage - a.keyword_match_percentage;
        } else if (sortBy === 'date') {
          return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
        } else {
          return a.company_name.localeCompare(b.company_name);
        }
      });
      
      setApplications(sortedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to fetch applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'applied': return '#3b82f6';
      case 'under_review': return '#f59e0b';
      case 'interview_scheduled': return '#8b5cf6';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'applied': return 'Applied';
      case 'under_review': return 'Under Review';
      case 'interview_scheduled': return 'Interview Scheduled';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'applied': return 'paper-plane-outline';
      case 'under_review': return 'eye-outline';
      case 'interview_scheduled': return 'videocam-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'rejected': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getMatchPercentageColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#f97316';
    return '#ef4444';
  };

  const getProgressDotStyle = (stageStatus: 'completed' | 'current' | 'pending' | 'rejected') => {
    switch (stageStatus) {
      case 'completed':
        return styles.progressDotCompleted;
      case 'current':
        return styles.progressDotCurrent;
      case 'pending':
        return styles.progressDotPending;
      case 'rejected':
        return styles.progressDotRejected;
      default:
        return styles.progressDotPending;
    }
  };

  const renderProgressLine = (status: Application['status']) => {
    const stages = ['applied', 'under_review', 'interview_scheduled', 'accepted'];
    const currentIndex = stages.indexOf(status);
    const isRejected = status === 'rejected';

    return (
      <View style={styles.progressLineContainer}>
        {stages.map((stage, index) => {
          let stageStatus: 'completed' | 'current' | 'pending' | 'rejected';
          
          if (isRejected && index > 0) {
            stageStatus = 'rejected';
          } else if (index < currentIndex) {
            stageStatus = 'completed';
          } else if (index === currentIndex) {
            stageStatus = 'current';
          } else {
            stageStatus = 'pending';
          }

          return (
            <React.Fragment key={stage}>
              <View style={[
                styles.progressDot,
                getProgressDotStyle(stageStatus)
              ]}>
                {stageStatus === 'completed' && (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                )}
                {stageStatus === 'current' && (
                  <View style={styles.currentDotInner} />
                )}
                {stageStatus === 'rejected' && (
                  <Ionicons name="close" size={12} color="#ffffff" />
                )}
              </View>
              {index < stages.length - 1 && (
                <View style={[
                  styles.progressLine,
                  stageStatus === 'completed' && styles.progressLineCompleted,
                  stageStatus === 'rejected' && styles.progressLineRejected
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const handleApplicationPress = (application: Application) => {
    setSelectedApplication(application);
    setShowJobDetailsModal(true);
  };

  const addTrackingEvent = () => {
    if (!selectedApplication || !newTrackingNote.trim()) {
      Alert.alert('Error', 'Please enter a follow-up note');
      return;
    }

    const newEvent: TrackingEvent = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      status: 'Follow Up',
      description: newTrackingNote.trim(),
      type: 'follow_up'
    };

    const updatedApplications = applications.map(app => {
      if (app.id === selectedApplication.id) {
        return {
          ...app,
          tracking_history: [...app.tracking_history, newEvent]
        };
      }
      return app;
    });

    setApplications(updatedApplications);
    setSelectedApplication({
      ...selectedApplication,
      tracking_history: [...selectedApplication.tracking_history, newEvent]
    });
    setNewTrackingNote('');
    
    Alert.alert('Success', 'Follow-up note added successfully!');
  };

  const getEventTypeColor = (type: TrackingEvent['type']) => {
    switch (type) {
      case 'status_change': return '#3b82f6';
      case 'communication': return '#10b981';
      case 'interview': return '#8b5cf6';
      case 'follow_up': return '#f59e0b';
      case 'offer': return '#059669';
      default: return '#6b7280';
    }
  };

  const updateApplicationStatus = (newStatus: Application['status']) => {
    if (!selectedApplication) return;

    const newEvent: TrackingEvent = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      status: getStatusText(newStatus),
      description: `Status updated to ${getStatusText(newStatus)}`,
      type: 'status_change'
    };

    const updatedApplications = applications.map(app => {
      if (app.id === selectedApplication.id) {
        return {
          ...app,
          status: newStatus,
          tracking_history: [...app.tracking_history, newEvent]
        };
      }
      return app;
    });

    setApplications(updatedApplications);
    setSelectedApplication({
      ...selectedApplication,
      status: newStatus,
      tracking_history: [...selectedApplication.tracking_history, newEvent]
    });

    Alert.alert('Success', `Status updated to ${getStatusText(newStatus)}`);
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>Company & Position</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>Status</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>Progress</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>Match</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={styles.tableHeaderText}>Date</Text>
      </View>
    </View>
  );

  const renderApplicationRow = ({ item }: { item: Application }) => (
    <TouchableOpacity 
      style={styles.tableRow}
      onPress={() => handleApplicationPress(item)}
      activeOpacity={0.7}
    >
      {/* Company & Position Column */}
      <View style={styles.tableCellCompany}>
        <Text style={styles.companyName}>{item.company_name}</Text>
        <Text style={styles.positionTitle}>{item.position_title}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.application_type === 'internship' ? '🎓 Intern' : '💼 FT'}
          </Text>
        </View>
        <Text style={styles.locationText}>📍 {item.location}</Text>
        {item.remote_option && <Text style={styles.remoteText}>🏠 Remote</Text>}
      </View>

      {/* Status Column */}
      <View style={styles.tableCellStatus}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color="#ffffff" 
          />
        </View>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>

      {/* Progress Column */}
      <View style={styles.tableCellProgress}>
        {renderProgressLine(item.status)}
        <Text style={styles.progressText}>
          {item.tracking_history.length} events
        </Text>
      </View>

      {/* Skills Match Column */}
      <View style={styles.tableCellMatch}>
        <View style={[styles.matchCircle, { borderColor: getMatchPercentageColor(item.keyword_match_percentage) }]}>
          <Text style={[styles.matchPercentage, { color: getMatchPercentageColor(item.keyword_match_percentage) }]}>
            {item.keyword_match_percentage}%
          </Text>
        </View>
        <Text style={styles.matchDetails}>
          {item.matched_keywords.length}/{item.total_keywords} skills
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.skillsScroll}
        >
          {item.matched_keywords.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {item.matched_keywords.length > 3 && (
            <Text style={styles.moreSkills}>+{item.matched_keywords.length - 3}</Text>
          )}
        </ScrollView>
      </View>

      {/* Date Column */}
      <View style={styles.tableCellDate}>
        <Text style={styles.dateText}>
          {new Date(item.application_date).toLocaleDateString()}
        </Text>
        <Text style={styles.platformText}>
          via {item.application_platform}
        </Text>
        {item.salary_range && (
          <Text style={styles.salaryText}>💰 {item.salary_range}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderJobDetailsModal = () => (
    <Modal
      visible={showJobDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.jobDetailsContainer}>
        <View style={styles.jobDetailsHeader}>
          <TouchableOpacity
            onPress={() => setShowJobDetailsModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.jobDetailsTitle}>Job Details</Text>
          <View style={styles.placeholder} />
        </View>

        {selectedApplication && (
          <ScrollView style={styles.jobDetailsContent} showsVerticalScrollIndicator={false}>
            {/* Job Header */}
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{selectedApplication.position_title}</Text>
              <Text style={styles.jobCompany}>{selectedApplication.company_name}</Text>
              
              <View style={styles.jobMetaRow}>
                <View style={styles.jobMetaItem}>
                  <Ionicons name="location-outline" size={16} color="#9ca3af" />
                  <Text style={styles.jobMetaText}>
                    {selectedApplication.remote_option ? 'Remote' : selectedApplication.location}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Ionicons name="cash-outline" size={16} color="#9ca3af" />
                  <Text style={styles.jobMetaText}>
                    {selectedApplication.salary_range || 'Salary not disclosed'}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                  <Text style={styles.jobMetaText}>2 days ago</Text>
                </View>
              </View>

              <View style={styles.jobTypeRow}>
                <View style={styles.jobTypeBadge}>
                  <Ionicons name="briefcase-outline" size={14} color="#1f2937" />
                  <Text style={styles.jobTypeText}>
                    {selectedApplication.application_type === 'internship' ? 'Internship' : 'Full-time'}
                  </Text>
                </View>
              </View>

              <View style={styles.skillMatchBadge}>
                <Text style={styles.skillMatchText}>
                  {selectedApplication.keyword_match_percentage}% match
                </Text>
              </View>
            </View>

            {/* Application Status & Key Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Application Status</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Current Status:</Text>
                  <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedApplication.status) }]}>
                    <Ionicons name={getStatusIcon(selectedApplication.status)} size={16} color="#ffffff" />
                    <Text style={styles.statusBadgeText}>{getStatusText(selectedApplication.status)}</Text>
                  </View>
                </View>
                
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Applied Date:</Text>
                  <Text style={styles.statusValue}>{new Date(selectedApplication.application_date).toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Platform:</Text>
                  <Text style={styles.statusValue}>{selectedApplication.application_platform}</Text>
                </View>
                
                {selectedApplication.salary_range && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Salary Range:</Text>
                    <Text style={[styles.statusValue, { color: '#059669', fontWeight: '600' }]}>
                      {selectedApplication.salary_range}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Job Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Position Applied For</Text>
              <Text style={styles.sectionText}>
                {selectedApplication.job_description}
              </Text>
            </View>

            {/* Notes Section */}
            {selectedApplication.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Application Notes</Text>
                <Text style={styles.sectionText}>
                  {selectedApplication.notes}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.appliedButton, { backgroundColor: getStatusColor(selectedApplication.status) }]}
                disabled={true}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.appliedButtonText}>
                  {selectedApplication.status === 'accepted' ? 'Offer Received!' : 
                   selectedApplication.status === 'rejected' ? 'Application Closed' :
                   selectedApplication.status === 'interview_scheduled' ? 'Interview Scheduled' :
                   'Application Submitted'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.trackingButton}
                onPress={() => {
                  setShowJobDetailsModal(false);
                  setShowTrackingModal(true);
                }}
              >
                <Ionicons name="analytics-outline" size={20} color="#2563eb" />
                <Text style={styles.trackingButtonText}>View Tracking History</Text>
              </TouchableOpacity>

              {selectedApplication.status === 'accepted' && (
                <TouchableOpacity 
                  style={styles.offerButton}
                  onPress={() => {
                    Alert.alert('Congratulations!', 'You have an offer from this company. Check your email for next steps.');
                  }}
                >
                  <Ionicons name="trophy" size={20} color="#10b981" />
                  <Text style={styles.offerButtonText}>View Offer Details</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderTrackingModal = () => (
    <Modal
      visible={showTrackingModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowTrackingModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Application Details</Text>
          <View style={styles.placeholder} />
        </View>

        {selectedApplication && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.applicationHeader}>
              <Text style={styles.modalCompanyName}>{selectedApplication.company_name}</Text>
              <Text style={styles.modalPositionTitle}>{selectedApplication.position_title}</Text>
              <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedApplication.status) }]}>
                <Text style={styles.modalStatusText}>{getStatusText(selectedApplication.status)}</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Status Update</Text>
              <View style={styles.statusButtons}>
                {(['applied', 'under_review', 'interview_scheduled', 'rejected', 'accepted'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      selectedApplication.status === status && styles.activeStatusButton
                    ]}
                    onPress={() => updateApplicationStatus(status)}
                    disabled={selectedApplication.status === status}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      selectedApplication.status === status && styles.activeStatusButtonText
                    ]}>
                      {getStatusText(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.addEventSection}>
              <Text style={styles.sectionTitle}>Add Follow-up Note</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="e.g., Called HR for update, Sent thank you email, Received recruiter response..."
                value={newTrackingNote}
                onChangeText={setNewTrackingNote}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.addEventButton}
                onPress={addTrackingEvent}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addEventButtonText}>Add Follow-up</Text>
              </TouchableOpacity>
            </View>

            {/* Application Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Application Timeline</Text>
              <View style={styles.timeline}>
                {selectedApplication.tracking_history
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((event, index) => (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: getEventTypeColor(event.type) }]} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineStatus}>{event.status}</Text>
                        <Text style={styles.timelineDate}>{new Date(event.date).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.timelineDescription}>{event.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filtersRow}>
        {/* Type Filter with Dropdown */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Type:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[styles.dropdownButton, showTypeDropdown && styles.activeDropdownButton]}
              onPress={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowSortDropdown(false);
              }}
            >
              <Text style={[styles.dropdownButtonText, showTypeDropdown && styles.activeDropdownButtonText]}>
                {filter === 'all' ? 'All' : 
                 filter === 'internship' ? 'Internships' : 'Jobs'}
              </Text>
              <Ionicons 
                name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={showTypeDropdown ? "#2563eb" : "#6b7280"} 
              />
            </TouchableOpacity>
            
            {showTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'internship', label: 'Internships' },
                  { key: 'job', label: 'Jobs' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownMenuItem,
                      filter === option.key && styles.activeDropdownMenuItem
                    ]}
                    onPress={() => {
                      setFilter(option.key as any);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownMenuItemText,
                      filter === option.key && styles.activeDropdownMenuItemText
                    ]}>
                      {option.label}
                    </Text>
                    {filter === option.key && (
                      <Ionicons name="checkmark" size={16} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Sort Filter with Dropdown */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Sort:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[styles.dropdownButton, showSortDropdown && styles.activeDropdownButton]}
              onPress={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowTypeDropdown(false);
              }}
            >
              <Text style={[styles.dropdownButtonText, showSortDropdown && styles.activeDropdownButtonText]}>
                {sortBy === 'date' ? 'Date' : 
                 sortBy === 'percentage' ? 'Match' : 'Company'}
              </Text>
              <Ionicons 
                name={showSortDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={showSortDropdown ? "#2563eb" : "#6b7280"} 
              />
            </TouchableOpacity>
            
            {showSortDropdown && (
              <View style={styles.dropdownMenu}>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'percentage', label: 'Match %' },
                  { key: 'company', label: 'Company' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dropdownMenuItem,
                      sortBy === option.key && styles.activeDropdownMenuItem
                    ]}
                    onPress={() => {
                      setSortBy(option.key as any);
                      setShowSortDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownMenuItemText,
                      sortBy === option.key && styles.activeDropdownMenuItemText
                    ]}>
                      {option.label}
                    </Text>
                    {sortBy === option.key && (
                      <Ionicons name="checkmark" size={16} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2563eb' }]}>{applications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
            {applications.filter(app => app.status === 'interview_scheduled').length}
          </Text>
          <Text style={styles.statLabel}>Interviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {applications.filter(app => app.status === 'accepted').length}
          </Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {applications.filter(app => app.status === 'rejected').length}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>
    </View>
  );

  if (loading && applications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={applications}
        renderItem={renderApplicationRow}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderTableHeader()}
          </>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
      {renderJobDetailsModal()}
      {renderTrackingModal()}
    </SafeAreaView>
  );
};

export default ApplicationsIndex;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374751',
    marginBottom: 6,
  },
  
  // New Dropdown Styles
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeDropdownButton: {
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.1,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  activeDropdownButtonText: {
    color: '#2563eb',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1001,
    marginTop: 4,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activeDropdownMenuItem: {
    backgroundColor: '#f0f9ff',
  },
  dropdownMenuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  activeDropdownMenuItemText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  
  // Keep existing filter button styles for backward compatibility
  filterButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  
  // Job Details Modal Styles
  jobDetailsContainer: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  jobDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  jobDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  jobDetailsContent: {
    flex: 1,
    padding: 20,
  },
  jobHeader: {
    marginBottom: 32,
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  jobCompany: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 16,
  },
  jobMetaRow: {
    marginBottom: 12,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobMetaText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 8,
  },
  jobTypeRow: {
    marginBottom: 16,
  },
  jobTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 16,
  },
  jobTypeText: {
    fontSize: 12,
    color: '#d1d5db',
    marginLeft: 6,
    fontWeight: '500',
  },
  skillMatchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#065f46',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  skillMatchText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
  },
  requirementsList: {
    marginTop: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 6,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  skillChipText: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  hrContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  hrAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hrAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  hrInfo: {
    flex: 1,
  },
  hrName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  hrTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  hrEmail: {
    fontSize: 13,
    color: '#60a5fa',
    marginBottom: 2,
  },
  hrPhone: {
    fontSize: 13,
    color: '#9ca3af',
  },
  hrContactButton: {
    padding: 8,
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
    marginTop: 8,
  },
  applyButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  appliedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    opacity: 0.8,
  },
  appliedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  interviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  interviewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  offerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  
  // Application Status Styles
  statusCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Skills Match Styles (removed from job details modal)
  matchSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  skillChipMatched: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#065f46',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  skillChipTextMatched: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  
  // Timeline Styles
  timelineSection: {
    marginBottom: 24,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tableCellCompany: {
    flex: 2,
    paddingRight: 8,
  },
  tableCellStatus: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCellProgress: {
    flex: 1.5,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCellMatch: {
    flex: 1.2,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCellDate: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  // Company Column Styles
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  positionTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginBottom: 2,
  },
  typeText: {
    fontSize: 9,
    color: '#0369a1',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 1,
  },
  remoteText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '500',
  },
  
  // Status Column Styles
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  interviewDate: {
    fontSize: 9,
    color: '#8b5cf6',
    marginTop: 2,
  },
  
  // Progress Line Styles
  progressLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCompleted: {
    backgroundColor: '#10b981',
  },
  progressDotCurrent: {
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  progressDotPending: {
    backgroundColor: '#e5e7eb',
  },
  progressDotRejected: {
    backgroundColor: '#ef4444',
  },
  currentDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 2,
  },
  progressLineCompleted: {
    backgroundColor: '#10b981',
  },
  progressLineRejected: {
    backgroundColor: '#ef4444',
  },
  progressText: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Match Column Styles
  matchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  matchPercentage: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  skillsScroll: {
    maxHeight: 20,
  },
  skillTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 2,
  },
  skillText: {
    fontSize: 8,
    color: '#065f46',
  },
  moreSkills: {
    fontSize: 8,
    color: '#6b7280',
    alignSelf: 'center',
  },
  
  // Date Column Styles
  dateText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  platformText: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  salaryText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  applicationHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCompanyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalPositionTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickActions: {
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  activeStatusButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeStatusButtonText: {
    color: '#ffffff',
  },
  addEventSection: {
    marginBottom: 24,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});