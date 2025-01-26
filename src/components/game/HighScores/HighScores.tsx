import { useEffect, useState } from 'react'
import { HighScore, getTopHighScores } from '../../../utils/highScores'
import styles from './HighScores.module.css'

export const HighScores = () => {
  const [highScores, setHighScores] = useState<HighScore[]>([])
  const [loading, setLoading] = useState(true)

  const loadHighScores = async () => {
    const scores = await getTopHighScores()
    setHighScores(scores)
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    loadHighScores()
  }, [])

  // Set up refresh interval
  useEffect(() => {
    const intervalId = setInterval(loadHighScores, 2000) // Refresh every 2 seconds
    return () => clearInterval(intervalId)
  }, [])

  if (loading) return <div>Loading high scores...</div>

  return (
    <div className={styles.highScores}>
      <h2>High Scores</h2>
      <div className={styles.scoresList}>
        {highScores.map((score, index) => (
          <div key={score.id} className={styles.scoreItem}>
            <span>{index + 1}.</span>
            <span>{score.player_name}</span>
            <span>{score.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 