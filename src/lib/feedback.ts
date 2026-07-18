export type FeedbackType = 'correct' | 'incorrect' | 'mastery'

// Free, safe-to-use audio files from Wikimedia/Public Domain sources
const SOUND_URLS = {
  correct: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Tetris_success_ding.ogg',
  incorrect: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Basso-Continuous.ogg',
  mastery: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Winning_Sound_Effect.ogg'
}

export const triggerFeedback = (type: FeedbackType) => {
  if (typeof window === 'undefined') return

  try {
    // Play Audio
    const audio = new Audio(SOUND_URLS[type])
    audio.volume = type === 'incorrect' ? 0.4 : 0.6
    audio.play().catch(e => {
      // Browser might block auto-play, fail silently
      console.debug('Audio play prevented:', e)
    })

    // Trigger Haptics
    if (navigator.vibrate) {
      if (type === 'correct') {
        navigator.vibrate([50, 50, 50]) // Double tap
      } else if (type === 'incorrect') {
        navigator.vibrate([100]) // Heavy single pulse
      } else if (type === 'mastery') {
        navigator.vibrate([50, 50, 100, 50, 150]) // Fanfare pattern
      }
    }
  } catch (err) {
    console.debug('Feedback engine error:', err)
  }
}
