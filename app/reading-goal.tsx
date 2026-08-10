import { router } from 'expo-router';
import { ReadingGoalScreen } from '../components/screens/reading-goal-screen';

export default function ReadingGoal() {
  return <ReadingGoalScreen onBack={() => router.back()} />;
}
