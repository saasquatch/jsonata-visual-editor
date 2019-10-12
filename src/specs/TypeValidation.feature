Feature: Type Validation

  Certain operators really only make sense for numbers or strings. For example
  greater than ">" and less than "<" make sense for numbers, and CAN be used 
  for strings but in most cases that doesn't make sense.

  To help guide people towards using numbers or strings for the right thing,
  we add additional real-time validation.

  Scenario Outline: Number comparisons warn for booleans and strings
    Given I'm editing an expression in the basic editor
    """ 
    <expression>
    """
    Then I will see validation error
    """
    Comparisons should compare to a string
    """

    Examples:
     | expression | 
     | a > "foo" | 
     | a < "foo" | 
     | a >= "foo" | 
     | a <= "foo" |
     | a > true |
     | a < true |
     | a >= true |
     | a <= true |  
