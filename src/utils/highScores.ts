import { createClient } from '@supabase/supabase-js'

// Replace these with your Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export interface HighScore {
  id?: number
  player_name: string
  score: number
  created_at?: string
}

export const saveHighScore = async (playerName: string, score: number): Promise<void> => {
  try {
    const { error, data } = await supabase
      .from('high_scores')
      .insert([{ player_name: playerName, score }])
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Score saved successfully:', data);
  } catch (error) {
    console.error('Error saving high score:', error);
  }
}

export const getTopHighScores = async (limit: number = 10): Promise<HighScore[]> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching high scores:', error)
    return []
  }
} 