'use client'

import { useState, useEffect } from 'react'

export function useTopicProgress(cohortId: string) {
  const [completedTopics, setCompletedTopics] = useState<string[]>([])

  useEffect(() => {
    const key = `steward_topics_${cohortId}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        setCompletedTopics(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse topic progress', e)
      }
    }
  }, [cohortId])

  const markTopicComplete = (mediaId: string) => {
    setCompletedTopics(prev => {
      if (prev.includes(mediaId)) return prev
      const newTopics = [...prev, mediaId]
      localStorage.setItem(`steward_topics_${cohortId}`, JSON.stringify(newTopics))
      return newTopics
    })
  }

  const isTopicComplete = (mediaId: string) => completedTopics.includes(mediaId)

  return { completedTopics, markTopicComplete, isTopicComplete }
}
