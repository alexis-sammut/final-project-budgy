from decimal import Decimal
from datetime import datetime, timedelta
from calendar import monthrange

DAYS_PER_FREQUENCY = {
    'daily': Decimal('1'),
    'weekly': Decimal('7'),
    'biweekly': Decimal('14'),
    '4-week': Decimal('28'),
    'yearly': Decimal('365'),
}


def get_days_in_month_cycle(year, month, due_date):
    """
    Get the number of days in a monthly billing cycle.
    Cycle runs from due_date of current month to (due_date - 1) of next month.
    
    Example: due_date = 10
    - May 10 to June 9 = days in May from 10th onwards + days in June until 9th
    """
    # Get the last day of the current month
    _, last_day = monthrange(year, month)
    
    # If due date is beyond the last day of month, use last day
    actual_due_date = min(due_date, last_day)
    
    # Days remaining in current month (including due date)
    days_in_current_month = last_day - actual_due_date + 1
    
    # Get next month
    if month == 12:
        next_month = 1
        next_year = year + 1
    else:
        next_month = month + 1
        next_year = year
    
    # Get the due date in next month (or last day if beyond)
    _, next_last_day = monthrange(next_year, next_month)
    next_actual_due_date = min(due_date, next_last_day)
    
    # Days in next month until (due_date - 1)
    days_in_next_month = next_actual_due_date - 1
    
    total_days = days_in_current_month + days_in_next_month
    
    return total_days


def calculate_item_amount_for_period(item, income_amount, start_date, end_date, period_type='custom'):
    """
    Calculate the prorated amount needed for an item during a specific period.
    
    For percentage items: returns percentage of income (rounded UP to nearest cent)
    For monthly items with period_type='1month' or 'month': returns full amount
    For regular items: calculates based on frequency and period overlap
    
    Args:
        period_type: '1week', '2weeks', '1month', 'oneoff', or 'custom'
    """
    if item.is_percentage and item.percentage_value:
        # Percentage items take % of total income
        percentage = Decimal(str(item.percentage_value)) / Decimal('100')
        raw_amount = income_amount * percentage
        
        # Round UP to nearest cent (ROUND_CEILING)
        from decimal import ROUND_CEILING
        return raw_amount.quantize(Decimal('0.01'), rounding=ROUND_CEILING)
    
    # For regular items, calculate based on frequency
    amount = Decimal(str(item.amount))
    frequency = item.frequency
    
    # Special handling for monthly items when period_type is a month period
    # Frontend sends: '1month', backend might normalize to 'month'
    if frequency == 'monthly' and period_type in ['month', '1month']:
        # Return full amount for monthly budgets
        return amount
    
    # Calculate number of days in the sorting period
    period_days = (end_date - start_date).days + 1  # +1 to include both start and end
    
    if frequency == 'monthly' and item.due_date:
        # Monthly items need special handling based on due dates
        return calculate_monthly_item_for_period(
            amount, 
            item.due_date, 
            start_date, 
            end_date, 
            period_days
        )
    else:
        # For non-monthly frequencies, use simple daily rate
        frequency_days = DAYS_PER_FREQUENCY.get(frequency, Decimal('30'))
        daily_rate = amount / frequency_days
        calculated_amount = daily_rate * Decimal(str(period_days))
        
        # Round to 2 decimal places
        return calculated_amount.quantize(Decimal('0.01'))


def calculate_monthly_item_for_period(amount, due_date, start_date, end_date, period_days):
    """
    Calculate prorated amount for a monthly item with a due date.
    
    The logic:
    1. Find all billing cycles that overlap with the sorting period
    2. For each cycle, calculate daily rate based on actual days in that cycle
    3. Prorate for days that fall within the sorting period
    """
    total_amount = Decimal('0')
    
    # Start from the month of start_date
    current_date = start_date
    
    while current_date <= end_date:
        year = current_date.year
        month = current_date.month
        
        # Get days in this billing cycle
        cycle_days = get_days_in_month_cycle(year, month, due_date)
        daily_rate = amount / Decimal(str(cycle_days))
        
        # Determine the billing cycle boundaries
        _, last_day = monthrange(year, month)
        actual_due_date = min(due_date, last_day)
        
        # Cycle starts on due_date of this month
        cycle_start = datetime(year, month, actual_due_date).date()
        
        # Cycle ends on (due_date - 1) of next month
        if month == 12:
            next_month = 1
            next_year = year + 1
        else:
            next_month = month + 1
            next_year = year
        
        _, next_last_day = monthrange(next_year, next_month)
        next_actual_due_date = min(due_date, next_last_day)
        cycle_end = datetime(next_year, next_month, next_actual_due_date - 1).date()
        
        # Find overlap between sorting period and this billing cycle
        overlap_start = max(start_date, cycle_start)
        overlap_end = min(end_date, cycle_end)
        
        if overlap_start <= overlap_end:
            overlap_days = (overlap_end - overlap_start).days + 1
            total_amount += daily_rate * Decimal(str(overlap_days))
        
        # Move to next billing cycle
        current_date = cycle_end + timedelta(days=1)
    
    return total_amount.quantize(Decimal('0.01'))


def calculate_pocket_total_for_period(pocket, income_amount, start_date, end_date, period_type='custom'):
    """
    Calculate the total amount needed for a pocket during the sorting period.
    Returns dict with total and breakdown per item.
    
    Args:
        period_type: '1week', '2weeks', '1month', 'oneoff', or 'custom'
    """
    items = pocket.items.filter(is_other=False)
    
    item_breakdown = []
    total = Decimal('0')
    
    for item in items:
        item_amount = calculate_item_amount_for_period(
            item, 
            income_amount, 
            start_date, 
            end_date,
            period_type
        )
        
        item_breakdown.append({
            'id': item.id,
            'name': item.name,
            'amount': item_amount,
            'is_percentage': item.is_percentage,
            'percentage_value': item.percentage_value,
            'frequency': item.frequency,
            'due_date': item.due_date,
        })
        
        total += item_amount
    
    total = total.quantize(Decimal('0.01'))
    
    return {
        'total': total,
        'items': item_breakdown
    }
    
def calculate_pocket_total_for_oneoff(pocket, income_amount):
    """
    Calculate pocket amount for one-off income (no items, just pocket amount).
    For one-off income, all pockets start at 0 - user allocates manually.
    Used when period_type is 'oneoff'.
    """
    from decimal import Decimal
    
    # For one-off, return 0 - user allocates manually
    return {
        'total': Decimal('0.00'),
        'items': [] 
    }