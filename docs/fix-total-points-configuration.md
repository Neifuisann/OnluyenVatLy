# How to Configure Lessons to Total Exactly 10 Points

## Current Issue
Your current configuration totals to 8.2 points instead of 10:
- ABCD: 10 questions × 0.60 = 6.00 points
- True/False: 2 questions × 0.60 = 1.20 points  
- Fill-in: 3 questions × 0.33 = 0.99 points (rounds to 1.00)
- **Total: 8.20 points**

## Solutions

### Option 1: Adjust Points Distribution (Recommended)
Change the points distribution to:
- ABCD: 6.67 points (10 questions × 0.667 ≈ 6.67)
- True/False: 1.33 points (2 questions × 0.665 ≈ 1.33)
- Fill-in: 2.00 points (3 questions × 0.667 ≈ 2.00)
- **Total: 10.00 points**

### Option 2: Change Question Counts
Keep 10 total points but adjust question numbers:
- ABCD: 12 questions × 0.50 = 6.00 points
- True/False: 4 questions × 0.50 = 2.00 points
- Fill-in: 4 questions × 0.50 = 2.00 points
- **Total: 10.00 points** (20 questions total)

### Option 3: Use Different Point Values
For exactly 10 points with 15 questions:
- ABCD: 10 questions, 7.00 points total (0.70 each)
- True/False: 2 questions, 1.00 points total (0.50 each)
- Fill-in: 3 questions, 2.00 points total (0.67, 0.67, 0.66)
- **Total: 10.00 points**

## Implementation
The code fix I've implemented ensures that whatever distribution you choose, the points will be distributed correctly among questions to match your total exactly, avoiding floating-point precision issues like 3 × 0.33 = 0.99.