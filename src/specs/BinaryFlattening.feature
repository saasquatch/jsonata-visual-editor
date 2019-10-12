Feature: Binary Flattening

  In JSONata the expression `a and b and c` is turned into an AST that looks like `(a and b) and c`.

  This works great for the backend logic, but isn't great for building a visual editor.

  To support a nicer boolean logic building experience, our visual builder needs to flatten 
  nested binary `and` and `or` conditions when the binary logic permits it.


  Scenario: Simple binary expressions are flattened
    Given an expression
      """
      a and b and c
      """
    When the basic editor renders
    Then it shows three conditions grouped together
      | a |
      | b |
      | c |

  Scenario: Switching and/or changes all the nodes
    Given an expression
      """
      a and b and c
      """
    When the basic editor renders
    And I change the type from "and" to "or"
    Then the output expression should backend
      """
      a or b or c
      """
