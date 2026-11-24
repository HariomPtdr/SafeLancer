// Previously animated numbers from 0, which made stats flash wrong values
// (and used a different digit grouping than the final value). Now returns
// the final value immediately, formatted for India.
export function useCountUp(target, _duration, prefix = '') {
  const numeric = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0
  return prefix + numeric.toLocaleString('en-IN')
}
