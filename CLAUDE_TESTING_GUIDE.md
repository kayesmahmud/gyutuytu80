# Claude Code Testing Guide

> **How to get Claude Code to test like a human during development**

## 🎯 The Problem

Most development time goes to manual testing. Every API endpoint, feature, or file change requires:
- Testing happy paths
- Testing error cases
- Checking edge cases
- Verifying integrations
- Retesting after fixes

**Solution:** Have Claude Code do comprehensive testing automatically during development.

---

## 🚀 Quick Start

### The Magic Phrase

Add **"and test it thoroughly"** to any request:

```
❌ "Add a payment endpoint"
✅ "Add a payment endpoint and test it thoroughly"

❌ "Fix the login bug"
✅ "Fix the login bug and verify it works with different scenarios"

❌ "Create user profile page"
✅ "Create user profile page. Make sure you test it before finishing"
```

### Instant Results

With testing instructions, Claude will:
1. Build the feature
2. Create test scenarios automatically
3. Execute tests (API calls, DB queries, etc.)
4. Find and fix issues
5. Retest to verify
6. Report results

**You save time. Code is more reliable.**

---

## 📋 Effective Testing Prompts

### For New Features

```
"Implement [feature]. Once done:
1. Test happy path with valid data
2. Test error cases (missing fields, invalid formats)
3. Test edge cases (empty strings, nulls, extreme values)
4. Verify database operations
5. Check API response format
6. Test authentication/authorization"
```

**Example:**
```
"Add email verification to user registration. Test with:
- Valid email format
- Invalid email format
- Already verified emails
- Expired verification tokens
- Database updates correctly
- Email sending works (or mock it)"
```

### For API Endpoints

```
"Create [endpoint]. Test with:
- Valid auth token
- No auth token
- Expired token
- Valid payload
- Missing required fields
- Invalid data types
- Edge cases (empty arrays, null values, etc.)
- Verify response format matches API spec"
```

**Example:**
```
"Create POST /api/ads/promote endpoint. Test thoroughly with:
- Valid ad ID + payment data
- Invalid ad ID
- Missing auth token
- Ad already promoted
- Insufficient payment amount
- Database rollback on failure"
```

### For Bug Fixes

```
"Fix [bug]. After fixing:
1. Reproduce the original issue first
2. Apply the fix
3. Verify the fix works
4. Test related functionality
5. Ensure no regression in other features"
```

**Example:**
```
"Fix the shop URL not showing custom slug. After fixing:
1. Test with custom slug set
2. Test with no custom slug (should use default)
3. Test slug update flow
4. Verify it doesn't break ad listings"
```

### For Database Changes

```
"Add [column/table/migration]. After migration:
1. Verify migration applies cleanly
2. Check for schema drift
3. Test queries using new schema
4. Verify constraints work (NOT NULL, UNIQUE, FK)
5. Test data transformation (if migrating existing data)"
```

**Example:**
```
"Add verification_pricing table. After migrating:
1. Check migration applied with no errors
2. Run npm run db:check-drift
3. Test inserting pricing records
4. Verify foreign keys to verification types work
5. Query the table to confirm structure"
```

### For Frontend Components

```
"Create [component]. Test:
- Component renders without errors
- Data displays correctly
- Form validation works
- API calls succeed
- Error states show properly
- Loading states work
- Edge cases (empty data, long text, etc.)"
```

**Example:**
```
"Create shop settings page. Test:
- Page loads without console errors
- Shop data displays correctly
- Form submission works
- Validation shows errors
- Success message appears
- Handles network failures gracefully"
```

### For Integration/Full Flows

```
"Implement [flow]. Test the entire journey:
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. Verify data persists correctly
5. Test failure at each step
6. Verify rollback/cleanup on errors"
```

**Example:**
```
"Implement ad promotion payment flow. Test end-to-end:
1. User clicks promote on ad
2. Payment initiation with Khalti
3. User completes payment
4. Webhook receives confirmation
5. Ad status updates to promoted
6. User sees promoted ad badge
7. Test payment failure scenarios
8. Test webhook replay/duplicate handling"
```

---

## 🧪 What Claude Can Test

### ✅ API Endpoints
- Valid/invalid requests
- Authentication/authorization
- Response formats
- Error handling
- Status codes
- Database operations

**Claude will use:**
```bash
curl -X POST http://localhost:5000/api/endpoint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

### ✅ Database Operations
- Migration execution
- Schema drift detection
- Query functionality
- Constraints (FK, UNIQUE, NOT NULL)
- Data integrity

**Claude will use:**
```bash
npm run db:check-drift
PGPASSWORD=postgres psql -U elw -d thulobazaar -c "SELECT * FROM table"
```

### ✅ Frontend Features
- Component rendering
- API integration
- Form validation
- Error states
- Console errors

**Claude will check:**
- Build succeeds (`npm run build`)
- Type checking passes
- No console errors mentioned
- API calls return expected data

### ✅ Type Safety
- TypeScript compilation
- Type definitions
- Import/export correctness

**Claude will run:**
```bash
npm run type-check
npx tsc --noEmit
```

### ✅ Integration Flows
- Multi-step processes
- Cross-service operations
- State management
- Error recovery

---

## 💡 Pro Tips

### 1. Set Expectations Upfront

**Good:**
```
"Add payment verification. Test thoroughly before considering it done."
```

**Better:**
```
"Add payment verification. Test with multiple payment providers,
invalid data, network failures, and verify database transactions.
Don't mark complete until all tests pass."
```

### 2. Use Testing in Todo Lists

When Claude creates a todo list, testing becomes a tracked task:

```
TODO:
- [in_progress] Create payment endpoint
- [pending] Test valid payment flow
- [pending] Test invalid payment data
- [pending] Test authentication failures
- [pending] Verify database updates
```

### 3. Request Test Scenarios First

```
"Before implementing the checkout flow, list all test scenarios
we should cover. Then implement and test each one."
```

Claude will create comprehensive scenarios you might not think of.

### 4. Continuous Testing

```
"As you build the user profile feature, test each section
as you complete it. Don't wait until the end."
```

### 5. Specify Test Data

```
"Test the ads API with:
- Ad ID: 1 (exists)
- Ad ID: 99999 (doesn't exist)
- User ID: 5 (verified business)
- User ID: 10 (unverified individual)"
```

### 6. Request Automated Tests

```
"Write unit tests for the payment service using Jest, then run them"
"Add Playwright e2e tests for the login flow"
```

---

## 🎬 Real-World Examples

### Example 1: New Feature

**❌ Without Testing:**
```
You: "Add ad promotion feature"
Claude: *builds feature*
You: *manually test, find 5 bugs*
You: "Fix: promotion not showing for verified users"
You: "Fix: payment amount validation broken"
You: "Fix: date calculation wrong"
... 30 minutes of back-and-forth ...
```

**✅ With Testing:**
```
You: "Add ad promotion feature. Test thoroughly with verified/unverified
      users, different payment amounts, and date calculations."
Claude: *builds feature*
Claude: *tests automatically*
Claude: "Found issue with verified user check, fixing..."
Claude: "Found payment validation bug, fixing..."
Claude: *retests*
Claude: "All tests pass. Feature ready."
You: *quick spot check* ✅ Done in 5 minutes!
```

### Example 2: Bug Fix

**Request:**
```
"The shop custom URL isn't working. Debug and fix it. After fixing:
1. Show me what was causing the bug
2. Test that custom URLs work
3. Test that default URLs still work as fallback
4. Verify the fix doesn't break ad listings or profiles"
```

**Claude will:**
- Read relevant code
- Identify the bug
- Fix it
- Test both custom and default URL flows
- Check related features
- Report results

### Example 3: API Endpoint

**Request:**
```
"Create GET /api/shop/:slug/analytics endpoint. Return:
- Total views (last 30 days)
- Total ads
- Active promotions
- Revenue (if business verified)

Test with:
- Valid shop slug
- Invalid shop slug
- Unauthenticated request
- User trying to access another user's analytics
- Verify SQL injection protection"
```

**Claude will:**
- Create the endpoint
- Add authentication middleware
- Write SQL queries
- Test each scenario with curl
- Fix any issues found
- Verify response format

---

## 📝 Testing Template (Copy & Use)

```
[YOUR TASK DESCRIPTION HERE]

Testing Requirements:
━━━━━━━━━━━━━━━━━━━━━━━
✓ Happy path with valid data
✓ Error cases (missing fields, invalid formats, wrong types)
✓ Edge cases (empty strings, null, undefined, extreme values)
✓ Authentication (valid token, no token, expired token)
✓ Authorization (correct user, wrong user, admin)
✓ Database operations (insert, update, delete, constraints)
✓ API response format matches specification
✓ No regression in existing features
✓ Console has no errors
✓ Type checking passes

Test thoroughly and fix any issues before marking complete.
```

---

## ⚡ Testing Commands Claude Uses

### API Testing
```bash
# GET request
curl -X GET "http://localhost:5000/api/users/profile" \
  -H "Authorization: Bearer $TOKEN"

# POST request
curl -X POST "http://localhost:5000/api/ads" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Ad","price":1000}'

# Test without auth
curl -X GET "http://localhost:5000/api/protected-route"
```

### Database Verification
```bash
# Check schema drift
npm run db:check-drift

# Query database
PGPASSWORD=postgres psql -U elw -d thulobazaar -c "
  SELECT * FROM users WHERE id = 1;
"

# Check migration status
npm run db:migrate:status
```

### Type Checking
```bash
# TypeScript compilation
npx tsc --noEmit

# Project type check
npm run type-check
```

### Process Verification
```bash
# Check if servers running
lsof -i:3333  # Frontend
lsof -i:5000  # Backend

# Check logs
tail -f logs/api.log
```

---

## 🎯 Testing Workflow

### Standard Workflow

```
┌─────────────────────────────────────────┐
│ You: "Add feature X and test it"       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Claude: *Creates todo list with tests* │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Claude: *Implements feature*            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Claude: *Runs test scenarios*           │
└────────────┬────────────────────────────┘
             │
             ▼
         Issue found?
         /          \
       Yes           No
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│ Claude: Fix  │  │ All tests ✓  │
└──────┬───────┘  └──────────────┘
       │
       └──────> Retest ────┘
```

### Your Role

You only need to:
1. **Specify what to build and that it should be tested**
2. **Review Claude's test results**
3. **Do final spot-check** (optional but recommended)

Claude handles:
- Creating test scenarios
- Executing tests
- Finding issues
- Fixing issues
- Retesting
- Reporting results

---

## 🚦 When to Request Testing

### Always Test
- ✅ New API endpoints
- ✅ Database migrations
- ✅ Authentication/authorization changes
- ✅ Payment/financial logic
- ✅ Data transformations
- ✅ Bug fixes

### Usually Test
- ✅ New UI components with API integration
- ✅ Form validation
- ✅ Complex business logic
- ✅ Integration flows

### Optional Testing
- 🟡 Simple UI-only components
- 🟡 Style changes
- 🟡 Documentation updates
- 🟡 Configuration changes

---

## 🎓 Advanced Testing Requests

### Performance Testing

```
"Add caching to the shop API. After implementing:
1. Measure response time without cache
2. Measure response time with cache
3. Verify cache invalidation works
4. Test with large datasets"
```

### Security Testing

```
"Review the authentication middleware for security issues. Test:
- SQL injection protection
- XSS prevention
- CSRF token validation
- Rate limiting
- Token expiration
- Password hashing strength"
```

### Load Testing

```
"Create a script to test ad listing API under load:
- 100 concurrent requests
- Measure response times
- Check for memory leaks
- Verify database connection pool"
```

### Regression Testing

```
"After refactoring the payment service, run regression tests:
- Verify all payment providers still work
- Test error handling hasn't changed
- Check database transactions still atomic
- Ensure API responses unchanged"
```

---

## 📊 Testing Checklist

Use this checklist for comprehensive testing:

```
API Endpoints:
□ Valid request succeeds
□ Invalid request returns proper error
□ Missing auth returns 401
□ Wrong user returns 403
□ Not found returns 404
□ Response format correct
□ Database updates correctly
□ Constraints enforced
□ Transactions rollback on error

Frontend:
□ Component renders without errors
□ API integration works
□ Loading states show
□ Error states show
□ Form validation works
□ Success messages display
□ No console errors
□ TypeScript compiles

Database:
□ Migration applies cleanly
□ No schema drift
□ Queries work
□ Indexes created
□ Constraints enforced
□ Data integrity maintained

Integration:
□ Full flow works end-to-end
□ Each step saves correctly
□ Errors at any step handled
□ Cleanup on failure
□ State consistent
```

---

## 🎁 Bonus: Testing Shortcuts

### Quick Test Requests

| Request | What Claude Does |
|---------|-----------------|
| "Test this endpoint" | Tests with valid/invalid data, auth checks |
| "Verify this works" | Runs appropriate tests for the context |
| "Check for bugs" | Reviews code and tests edge cases |
| "Test thoroughly" | Comprehensive testing with multiple scenarios |
| "Smoke test" | Quick basic functionality check |

### Combination Requests

```
"Build X, test it, then move to Y"
"Fix bug A, verify it's fixed, then work on feature B"
"Add endpoint, test it, then document the API"
```

---

## ✅ Success Metrics

You'll know this approach works when:

1. **Less Back-and-Forth**
   - Fewer "fix this bug" messages
   - Features work on first try more often

2. **Faster Development**
   - Less time manually testing
   - Issues caught during development

3. **Higher Quality**
   - Edge cases handled
   - Error handling comprehensive
   - Fewer production bugs

4. **Better Documentation**
   - Test scenarios document expected behavior
   - API testing shows usage examples

---

## 🚀 Get Started Now

### Your Next Request

Instead of:
```
"Add a forgot password feature"
```

Try:
```
"Add a forgot password feature. Test the entire flow:
1. User requests reset
2. Email sent (verify format)
3. Token in email works
4. Expired token rejected
5. Password updates successfully
6. Old password no longer works
7. User can log in with new password

Test thoroughly and fix any issues found."
```

### Adopt This Habit

**Before every request, ask yourself:**
> "What could go wrong with this feature?"

Then add those scenarios to your testing requirements.

---

## 📚 Related Guides

- **CLAUDE.md** - Project-specific guidelines
- **~/.claude/CLAUDE.md** - Your global Claude Code settings
- **SCHEMA_DRIFT_PREVENTION.md** - Database testing
- **complete_claude_guide.md** - Comprehensive development guide

---

## 💬 Example Conversation

```
You: "Add ad search with filters and test it thoroughly"

Claude: "I'll implement the ad search feature with filtering.
Let me create a todo list for this task:

TODO:
- [in_progress] Create search API endpoint
- [pending] Add filters (category, location, price range)
- [pending] Test with valid filters
- [pending] Test with invalid filters
- [pending] Test with no results
- [pending] Test with many results (pagination)
- [pending] Test performance with large dataset

Building the endpoint..."

Claude: *implements feature*

Claude: "Now testing the search endpoint with various scenarios:

✓ Valid search with filters - Works
✓ Empty search - Returns all ads
✗ Invalid category ID - Found bug! Returns 500, should return 400
  Fixing...
✓ Invalid category ID - Now returns proper error
✓ Price range filters - Works
✓ Combined filters - Works
✓ No results case - Returns empty array correctly
✓ Pagination - Works with 20 items per page

All tests pass! Search feature is ready."

You: *Quick spot check* "Great! Move on to the next feature."
```

---

## 🎯 Key Takeaway

**Add "and test it thoroughly" to every request.**

Claude will:
- ✅ Create comprehensive test scenarios
- ✅ Execute tests automatically
- ✅ Find and fix issues
- ✅ Retest to verify
- ✅ Report results

**You save time. Code quality improves. Win-win.**

---

**Made with ❤️ for productive development**
*Last updated: 2025-12-16*
