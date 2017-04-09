export const durationToSeconds = (duration) => {
  let totalSeconds = 0

  if (duration) {
    const durationParts = duration.split(':').reverse()

    for (let i = 0; i < durationParts.length; i++) {
      let partSeconds = parseInt(durationParts[i], 10) || 0
      let iCopy = i

      while (iCopy > 0) {
        partSeconds = partSeconds * 60
        iCopy--
      }

      totalSeconds += partSeconds
    }
  }

  return totalSeconds
}
