Feature: Type Coercion

  Usually when people type numbers, they are intended to be used as numbers, not as strings.
  Similarly when people write "true" or "false", they intend for those to be used as boolean values, not as strings.
  The type coersion in the value editor uses these assumptions to make it faster
  and easier for people to just type what they want, and it's processed accordingly

  Scenario Outline: Automaticly switching expression based on what you type
    Given I'm typing into the String editor
    When I type 
    """
    <input>
    """
    Then the expression should be
    """
    <output>
    """

    Examples:
    | input | output |
    | foo | "foo" |
    | 123 | 123 |
    | 3.14 | 3.14 | ## TODO: Breaks when typing `3.`
    | true | true |
    | false | false |
    | tru | "tru" | 
    | null | null |
    | has"quotes |  "has\"quotes" |

