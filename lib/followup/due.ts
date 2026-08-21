/** A commitment is due for follow-up once its `use_on` day has passed. Dates are YYYY-MM-DD. */
export function isFollowUpDue(useOn: string, today: string): boolean {
  return useOn < today;
}
