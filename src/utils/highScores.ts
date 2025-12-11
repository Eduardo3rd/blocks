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

export const saveHighScore = async (playerName: string, score: number): Promise<boolean> => {
  try {
    const { error, data } = await supabase
      .from('high_scores')
      .insert([{ player_name: playerName, score }])
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Score saved successfully:', data);
    
    // Prune to keep only top 100 after inserting
    await pruneHighScores();
    
    return true;
  } catch (error) {
    console.error('Error saving high score:', error);
    return false;
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

export const getHighestScore = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('score')
      .order('score', { ascending: false })
      .limit(1)
    
    if (error) throw error
    const firstScore = data?.[0]
    return firstScore?.score ?? 0
  } catch (error) {
    console.error('Error fetching highest score:', error)
    return 0
  }
}

// Keep only top 100 scores in the database
const pruneHighScores = async (): Promise<void> => {
  try {
    // Get the 100th highest score
    const { data: topScores, error: fetchError } = await supabase
      .from('high_scores')
      .select('id, score')
      .order('score', { ascending: false })
      .limit(100)
    
    if (fetchError) throw fetchError
    
    if (topScores && topScores.length === 100) {
      const lastScore = topScores[99]
      if (lastScore) {
        const minScoreToKeep = lastScore.score
        
        // Delete all scores below the 100th highest
        const { error: deleteError } = await supabase
          .from('high_scores')
          .delete()
          .lt('score', minScoreToKeep)
        
        if (deleteError) throw deleteError
      }
    }
  } catch (error) {
    console.error('Error pruning high scores:', error)
  }
} 