---
sidebar_position: 7
---

# SemanticDate

`SemanticDate` wraps the native `Date` type with natural language parsing, intelligent period checking, and contextual formatting.

## Creating a SemanticDate

```typescript
import { SemanticDate } from 'semantic-primitives';

// From existing Date
const date = SemanticDate.from(new Date());

// From natural language (async)
const tomorrow = await SemanticDate.from("tomorrow");
const nextWeek = await SemanticDate.from("next Monday at 3pm");
const relative = await SemanticDate.from("in 2 weeks");
const deadline = await SemanticDate.from("end of Q2 2024");
```

## Natural Language Parsing

SemanticDate can parse various date expressions:

```typescript
// Relative dates
await SemanticDate.from("tomorrow");
await SemanticDate.from("yesterday");
await SemanticDate.from("next Friday");
await SemanticDate.from("last Monday");
await SemanticDate.from("in 3 days");
await SemanticDate.from("2 weeks ago");

// Time expressions
await SemanticDate.from("next Monday at 3pm");
await SemanticDate.from("tomorrow morning");
await SemanticDate.from("this evening");

// Business expressions
await SemanticDate.from("end of month");
await SemanticDate.from("beginning of next quarter");
await SemanticDate.from("fiscal year end");
await SemanticDate.from("next business day");

// Cultural/holiday dates
await SemanticDate.from("next Christmas");
await SemanticDate.from("Thanksgiving 2024");
```

## Methods

### semanticallyEquals

Compare dates with adjustable precision.

```typescript
const date1 = await SemanticDate.from("March 15, 2024 at 2:30pm");
const date2 = await SemanticDate.from("March 15, 2024 at 2:45pm");

const result = await date1.semanticallyEquals(date2, {
  precision: 'hour'  // 'year' | 'month' | 'day' | 'hour' | 'minute' | 'exact'
});
// { equivalent: true, confidence: 1.0 }

const exactResult = await date1.semanticallyEquals(date2, {
  precision: 'exact'
});
// { equivalent: false, confidence: 1.0 }
```

### describe

Get a human-readable description.

```typescript
const date = await SemanticDate.from("2024-12-25");

const description = await date.describe();
// "Christmas Day 2024, a Wednesday"

const meeting = await SemanticDate.from("next Tuesday at 2pm");
const desc = await meeting.describe();
// "Next Tuesday, January 30th at 2:00 PM - 3 days from now"
```

### formatFor

Format the date for a specific context.

```typescript
const date = await SemanticDate.from("2024-03-15T14:30:00");

await date.formatFor("email subject");
// "Mar 15, 2024"

await date.formatFor("formal document");
// "March 15, 2024"

await date.formatFor("casual conversation");
// "Friday the 15th"

await date.formatFor("API timestamp");
// "2024-03-15T14:30:00Z"
```

### isInPeriod

Check if the date falls within a named period.

```typescript
const date = await SemanticDate.from("December 26, 2024");

await date.isInPeriod("Christmas season");
// { inPeriod: true, confidence: 0.95 }

await date.isInPeriod("Q4 2024");
// { inPeriod: true, confidence: 1.0 }

await date.isInPeriod("summer");
// { inPeriod: false, confidence: 0.98 }
```

### nextOccurrence / previousOccurrence

Find the next or previous occurrence of a day or date.

```typescript
const now = SemanticDate.from(new Date());

const nextFriday = await now.nextOccurrence("Friday");
const lastPayday = await now.previousOccurrence("15th of the month");
const nextHoliday = await now.nextOccurrence("federal holiday");
```

### durationUntil

Calculate duration to another date with semantic understanding.

```typescript
const start = await SemanticDate.from("today");
const end = await SemanticDate.from("next Christmas");

const duration = await start.durationUntil(end);
// {
//   days: 330,
//   businessDays: 236,
//   description: "About 11 months",
//   breakdown: { months: 11, weeks: 0, days: 2 }
// }
```

### isReasonable

Validate if the date is reasonable for a context.

```typescript
const date = await SemanticDate.from("2024-01-15");

await date.isReasonable("user birth date");
// { reasonable: true }

await date.isReasonable("appointment scheduling");
// { reasonable: false, explanation: "Date is in the past" }

const future = await SemanticDate.from("2099-12-31");
await future.isReasonable("delivery date");
// { reasonable: false, explanation: "Date is too far in the future" }
```

### addDuration

Add time duration intelligently.

```typescript
const date = await SemanticDate.from("January 31, 2024");

const plusMonth = await date.addDuration(1, "month");
// February 29, 2024 (handles month-end correctly)

const plusBizDays = await date.addDuration(5, "business days");
// February 7, 2024 (skips weekends)
```

### inferMeaning

Detect the semantic meaning of the date.

```typescript
const date = await SemanticDate.from("December 25, 2024");

const meaning = await date.inferMeaning();
// {
//   meaning: 'holiday',
//   specificMeaning: 'Christmas Day',
//   significance: 'major_holiday',
//   confidence: 0.99
// }

const deadline = await SemanticDate.from("March 31, 2024");
const meaning2 = await deadline.inferMeaning();
// {
//   meaning: 'deadline',
//   specificMeaning: 'quarter_end',
//   significance: 'business_milestone',
//   confidence: 0.85
// }
```

## Implemented Interfaces

- `Semantic<Date>` - Base semantic interface
- `Comparable` - Semantic comparison
- `ContextValidatable` - Context-aware validation
- `Describable` - Human-readable descriptions

## Examples

### Appointment Scheduling

```typescript
async function scheduleAppointment(userInput: string) {
  const date = await SemanticDate.from(userInput);

  // Validate the date
  const reasonable = await date.isReasonable("appointment scheduling");
  if (!reasonable.reasonable) {
    throw new Error(reasonable.explanation);
  }

  // Check if it's a business day
  const isBusinessDay = await date.isInPeriod("business hours");

  // Format for confirmation
  const formatted = await date.formatFor("appointment confirmation email");

  return {
    date: date.valueOf(),
    formatted,
    isBusinessDay: isBusinessDay.inPeriod,
    description: await date.describe()
  };
}

await scheduleAppointment("next Tuesday at 2pm");
```

### Deadline Management

```typescript
async function analyzeDeadline(deadlineInput: string) {
  const deadline = await SemanticDate.from(deadlineInput);
  const now = SemanticDate.from(new Date());

  const duration = await now.durationUntil(deadline);
  const meaning = await deadline.inferMeaning();

  let urgency: string;
  if (duration.businessDays <= 1) {
    urgency = 'critical';
  } else if (duration.businessDays <= 5) {
    urgency = 'high';
  } else if (duration.businessDays <= 10) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  return {
    deadline: deadline.valueOf(),
    daysRemaining: duration.days,
    businessDaysRemaining: duration.businessDays,
    urgency,
    type: meaning.specificMeaning,
    description: duration.description
  };
}

await analyzeDeadline("end of sprint");
```

### Event Planning

```typescript
async function planRecurringEvent(
  description: string,
  startFrom: string,
  count: number
) {
  const start = await SemanticDate.from(startFrom);
  const occurrences: Date[] = [];

  let current = start;
  for (let i = 0; i < count; i++) {
    const next = await current.nextOccurrence(description);
    occurrences.push(next.valueOf());
    current = next;
  }

  return occurrences.map(async (date) => {
    const semantic = SemanticDate.from(date);
    return {
      date,
      formatted: await semantic.formatFor("calendar event"),
      inHolidayPeriod: (await semantic.isInPeriod("holiday season")).inPeriod
    };
  });
}

await planRecurringEvent("first Monday", "today", 12);
```
