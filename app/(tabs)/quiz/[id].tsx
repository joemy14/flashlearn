import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';

const fallbackQuizData = [
  {
    category: 'FUNDAMENTALS',
    question: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
    correct: 1
  },
  {
    category: 'GEOGRAPHY',
    question: 'What is the capital of the Byzantine Empire?',
    options: ['Rome', 'Athens', 'Constantinople', 'Alexandria'],
    correct: 2
  },
  {
    category: 'ART HISTORY',
    question: "Who painted 'The Starry Night'?",
    options: ['Claude Monet', 'Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso'],
    correct: 1
  }
];

export default function QuizScreen() {
  const { incomingQuizData } = useLocalSearchParams();
  const navigation = useNavigation();
  const [quizData, setQuizData] = useState<any[]>(fallbackQuizData);

  const [current, setCurrent] = useState<number>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [rating, setRating] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Analytics Tracking States
  const [answersLog, setAnswersLog] = useState<any[]>([]);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);

  useEffect(() => {
    // Unconditionally hide the navigation bars during the entire quiz tab to completely avoid skipping or exiting accidentally.
    navigation.getParent()?.setOptions({ 
       tabBarStyle: { display: 'none' } 
    });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
    }
  }, [navigation]);

  const handleDownloadOffline = async () => {
    try {
      const categoryLabel = quizData[0]?.category?.replace(/[^a-zA-Z0-9]/g, '_') || 'Custom_Quiz';

      if (Platform.OS === 'web') {
        const jsonBlob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
        const urlObj = URL.createObjectURL(jsonBlob);
        const anchor = document.createElement('a');
        anchor.href = urlObj;
        anchor.download = `FlashLearn_Quiz_Backup_${Date.now()}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(urlObj);
        Alert.alert('Saved Offline!', 'The quiz has been successfully downloaded to your computer as a physical JSON file.');
      } else if (Platform.OS === 'android') {
        // Native Android explicit folder targeting (Lets you literally open the "Downloads" view)
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const safUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, `FlashLearn_${categoryLabel}_${Date.now()}.json`, 'application/json');
          await FileSystem.writeAsStringAsync(safUri, JSON.stringify(quizData, null, 2));
          Alert.alert('Saved to Downloads!', 'Quiz file generated and physically placed perfectly into your exact chosen folder!');
        } else {
           Alert.alert('Permission Denied', 'We need storage permission to put it directly into your Downloads folder.');
        }
      } else {
        // Default physical iOS/App cache fallback
        const targetUri = `${FileSystem.documentDirectory}FlashLearn_${categoryLabel}_${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(targetUri, JSON.stringify(quizData, null, 2));
        Alert.alert(
          'Saved to Device Storage!', 
          `Quiz successfully secured directly to your physical iOS file system space at: \n\n${targetUri}\n\nYou can now study this safely without internet!`
        );
      }
    } catch (err: any) {
      Alert.alert('Download Error', `Could not save the physical file locally: ${err.message}`);
    }
  };

  useEffect(() => {
    if (incomingQuizData && typeof incomingQuizData === 'string') {
      try {
        const parsed = JSON.parse(incomingQuizData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuizData(parsed);
          setCurrent(0);
          setSelected(null);
          setIsFinished(false);
          setTimeLeft(15);
          setAnswersLog([]);
          setTotalTimeSpent(0);
        }
      } catch (e) {
        console.error("Failed to parse incoming quiz payload");
      }
    }
  }, [incomingQuizData]);

  useEffect(() => {
    // Stop timer if finished, an option has been selected, or the quiz is explicitly paused
    if (isFinished || selected !== null || isPaused) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          nextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [current, isFinished, selected, isPaused]);

  const handleSelect = (idx: number) => {
    setSelected(idx);
  };

  const nextQuestion = () => {
    const q = quizData[current];
    const isCorrect = selected === q.correct;
    
    setAnswersLog(prev => [...prev, {
       question: q.question,
       answered: selected !== null ? q.options[selected] : "Time Out / Skipped",
       correctAns: q.options[q.correct],
       isCorrect: isCorrect
    }]);

    setTotalTimeSpent(prev => prev + (15 - Math.max(0, timeLeft)));

    if (current < quizData.length - 1) {
      setCurrent(current + 1);
      setSelected(null);
      setTimeLeft(15);
    } else {
      setIsFinished(true);
    }
  };

  const skipQuestion = () => {
    nextQuestion();
  };

  // -------------------------------------------------------------
  // RESULTS STATE
  // -------------------------------------------------------------
  if (isFinished) {
    const correctCount = answersLog.filter(a => a.isCorrect).length;
    const diffSec = totalTimeSpent;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const timeDisplay = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return (
      <View style={styles.mainContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity>
              <MaterialIcons name="menu" size={28} color="#006156" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>FlashLearn</Text>
            <View style={{ flex: 1 }} />
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.avatar} />
          </View>

          {/* Fire Badge */}
          <View style={styles.centerWrap}>
            <View style={styles.fireBadgeWrap}>
              <View style={styles.streakLabel}>
                 <Text style={styles.streakLabelText}>Quiz Complete</Text>
              </View>
              <MaterialIcons name="local-fire-department" size={48} color="white" />
            </View>
            <Text style={styles.congratsTitle}>Scores In!</Text>
            <Text style={styles.congratsDesc}>Here is how you performed against the Gemini AI.</Text>
          </View>

          {/* Score Card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreText}>{correctCount}/{quizData.length}</Text>
            <Text style={styles.scoreSub}>GREAT JOB!</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialIcons name="check-circle" size={20} color="#16a34a" />
              <Text style={styles.statBoxNum}>{correctCount}</Text>
              <Text style={styles.statBoxLabel}>CORRECT</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialIcons name="cancel" size={20} color="#dc2626" />
              <Text style={styles.statBoxNum}>{quizData.length - correctCount}</Text>
              <Text style={styles.statBoxLabel}>WRONG/SKIPPED</Text>
            </View>
          </View>
          <View style={styles.timeBox}>
            <View style={styles.timeIconWrap}>
              <MaterialIcons name="timer" size={20} color="#006156" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.timeValue}>{timeDisplay}</Text>
              <Text style={styles.timeLabel}>COMPLETION TIME</Text>
            </View>
            <Text style={styles.xpText}>+{correctCount * 15} XP</Text>
          </View>

          {/* Offline Download Action */}
          <TouchableOpacity 
            style={{ flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginTop: 12, borderWidth: 1, borderColor: '#bae6fd'}}
            onPress={handleDownloadOffline}
          >
             <MaterialIcons name="offline-pin" size={24} color="#0284c7" />
             <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#0369a1' }}>Download for Offline Use</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Review Answers</Text>

          {/* Answer List */}
          {answersLog.slice(0, 2).map((ans, idx) => (
            <View key={idx} style={styles.answerItem}>
              <View style={[styles.answerIconWrap, { backgroundColor: ans.isCorrect ? '#dcfce7' : '#fee2e2' }]}>
                <MaterialIcons name={ans.isCorrect ? "check" : "close"} size={16} color={ans.isCorrect ? "#16a34a" : "#dc2626"} />
              </View>
              <View style={styles.answerContent}>
                <Text style={styles.ansQuestionText}>{ans.question}</Text>
                <Text style={[styles.ansUserText, { color: ans.isCorrect ? '#6b7280' : '#dc2626' }]}>
                  Answered: {ans.answered}
                </Text>
                {!ans.isCorrect && (
                  <Text style={styles.ansCorrectText}>Correct: {ans.correctAns}</Text>
                )}
              </View>
            </View>
          ))}
          
          {answersLog.length > 2 && (
             <TouchableOpacity style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                <Text style={{ color: '#006156', fontWeight: 'bold' }}>Review Answers Area ({answersLog.length - 2} more)</Text>
             </TouchableOpacity>
          )}

          {/* Bottom Actions */}
          <View style={{ gap: 12, marginBottom: 40, marginTop: 12 }}>
            <TouchableOpacity onPress={() => { setIsFinished(false); setCurrent(0); setTimeLeft(15); setSelected(null); setAnswersLog([]); setTotalTimeSpent(0); }} style={styles.secondaryActionBtn}>
              <Text style={styles.secondaryActionText}>Restart / Return</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE QUIZ STATE
  // -------------------------------------------------------------
  const q = quizData[current];
  const timerDisplay = `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`;

  return (
    <View style={styles.mainContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <MaterialIcons name="menu" size={28} color="#006156" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FlashLearn</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerModule}>BIOLOGY 101</Text>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={[styles.avatar, { marginLeft: 12 }]} />
        </View>

        <View style={styles.progressHeaderRow}>
          <View>
            <Text style={styles.progressSub}>QUIZ PROGRESS</Text>
            <Text style={styles.progressTitle}>Question {current + 1} of {quizData.length}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={{ backgroundColor: '#e5e7eb', padding: 8, borderRadius: 16 }}>
               <MaterialIcons name={isPaused ? "play-arrow" : "pause"} size={16} color="#1f2937" />
            </TouchableOpacity>
            <View style={[styles.timerPill, timeLeft <= 5 && { backgroundColor: '#fee2e2' }]}>
              <MaterialIcons name="schedule" size={16} color={timeLeft <= 5 ? "#dc2626" : "#006156"} />
              <Text style={[styles.timerText, timeLeft <= 5 && { color: "#dc2626" }]}>{timerDisplay}</Text>
            </View>
          </View>
        </View>

        <View style={styles.globalProgressBarBg}>
          <View style={[styles.globalProgressBarFill, { width: `${((current + 1) / quizData.length) * 100}%` }]} />
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          {isPaused ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
               <MaterialIcons name="pause-circle-outline" size={64} color="#9ca3af" />
               <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 16 }}>Quiz Paused</Text>
               <TouchableOpacity style={[styles.submitPill, { marginTop: 32, width: '100%', alignItems: 'center' }]} onPress={() => setIsPaused(false)}>
                  <Text style={styles.submitPillText}>Resume Quiz</Text>
               </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.badge, { backgroundColor: '#aeebe0' }]}>
                <Text style={[styles.badgeText, { color: '#006156' }]}>{q.category}</Text>
              </View>
              <Text style={styles.questionTextLarge}>{q.question}</Text>
            </>
          )}
        </View>

        {/* Options */}
        {!isPaused && q.options.map((opt: string, idx: number) => {
          const isSelected = selected === idx;
          return (
            <TouchableOpacity 
              key={idx} 
              onPress={() => handleSelect(idx)}
              style={[
                styles.optionRow, 
                isSelected && styles.optionRowSelected
              ]}
            >
              <View style={[styles.optionLetterIcon, isSelected && styles.optionLetterIconSelected]}>
                <Text style={[styles.optionLetterText, isSelected && styles.optionLetterTextSelected]}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {isSelected && <MaterialIcons name="check-circle" size={24} color="#006156" />}
            </TouchableOpacity>
          );
        })}

        {/* Actions */}
        {!isPaused && (
          <View style={styles.quizActionsRow}>
            <TouchableOpacity onPress={skipQuestion}>
              <Text style={styles.skipText}>SKIP QUESTION</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={nextQuestion} style={styles.submitPill}>
              <Text style={styles.submitPillText}>SUBMIT ANSWER</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f7faf9',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006156',
    marginLeft: 12,
  },
  headerModule: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006156',
    letterSpacing: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f2937'
  },
  // Active Quiz Styles
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressSub: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#006156',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006156',
  },
  globalProgressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 32,
  },
  globalProgressBarFill: {
    height: '100%',
    backgroundColor: '#68d391',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  questionTextLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 32,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  optionRowSelected: {
    backgroundColor: '#a7f3d0',
    borderWidth: 1,
    borderColor: '#006156',
  },
  optionLetterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionLetterIconSelected: {
    backgroundColor: '#6ee7b7',
  },
  optionLetterText: {
    fontWeight: 'bold',
    color: '#1f2937',
    fontSize: 14,
  },
  optionLetterTextSelected: {
    color: '#006156',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  quizActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  skipText: {
    fontWeight: 'bold',
    color: '#006156',
  },
  submitPill: {
    backgroundColor: '#006156',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
  },
  submitPillText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Results State Styles
  centerWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  fireBadgeWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#006156',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  streakLabel: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#166534',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  streakLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006156',
    marginBottom: 8,
  },
  congratsDesc: {
    fontSize: 15,
    color: '#4b5563',
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#006156',
  },
  scoreSub: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
    letterSpacing: 1,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
  },
  statBoxNum: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statBoxLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  timeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#5eead4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timeLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  xpText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  answerItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  answerIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  answerContent: {
    flex: 1,
  },
  ansQuestionText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  ansUserText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  ansCorrectText: {
    fontSize: 12,
    color: '#16a34a',
  },
  submitBtnLight: {
    backgroundColor: '#a7f3d0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  submitBtnLightText: {
    color: '#006156',
    fontWeight: 'bold',
  },
  primaryActionBtn: {
    backgroundColor: '#006156',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryActionBtn: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#006156',
    fontWeight: 'bold',
    fontSize: 16,
  }
});