import { useEffect, useState } from 'react'
import { HighScore, getTopHighScores } from '../../../utils/highScores'
import styles from './HighScores.module.css'

interface HighScoresProps {
  limit?: number;
  refreshInterval?: number;
}

export const HighScores: React.FC<HighScoresProps> = ({ 
  limit = 10, 
  refreshInterval = 5000 
}) => {
  const [highScores, setHighScores] = useState<HighScore[]>([])
  const [loading, setLoading] = useState(true)

  const loadHighScores = async () => {
    const scores = await getTopHighScores(limit)
    setHighScores(scores)
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    loadHighScores()
  }, [limit])

  // Set up refresh interval
  useEffect(() => {
    const intervalId = setInterval(loadHighScores, refreshInterval)
    return () => clearInterval(intervalId)
  }, [refreshInterval])

  if (loading) {
    return (
      <div className={styles.highScores}>
        <h2 className={styles.title}>🏆 LEADERBOARD</h2>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (highScores.length === 0) {
    return (
      <div className={styles.highScores}>
        <h2 className={styles.title}>🏆 LEADERBOARD</h2>
        <div className={styles.empty}>No scores yet. Be the first!</div>
      </div>
    )
  }

  return (
    <div className={styles.highScores}>
      <h2 className={styles.title}>🏆 LEADERBOARD</h2>
      <div className={styles.scoresList}>
        {highScores.map((score, index) => (
          <div 
            key={score.id} 
            className={`${styles.scoreItem} ${index === 0 ? styles.first : ''} ${index === 1 ? styles.second : ''} ${index === 2 ? styles.third : ''}`}
          >
            <span className={styles.rank}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
            </span>
            <span className={styles.playerName}>{score.player_name}</span>
            <span className={styles.score}>{score.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 