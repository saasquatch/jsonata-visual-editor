Feature: Toggling between Basic and advanced

  JSONata is a big complex language, and it's not easy to allow all posibilities with a visual editor.
  Advanced users can use custom expressions, and a visual builder lets basic users get started quickly.

  Scenario: Can switch to Basic editor on binary expressions
    Given the expression is simple
    """
    revenue > 30
    """
    Then [Switch to Basic] is enabled


  Scenario: Can't switch on errors
    Given the expression is invalid JSONata
    """
    error nd 111 -9=-9
    """
    Then [Switch to Basic] is disabled


  Scenario: Can't switch on complex expressions
    Given the expression is advanced
    """
    "12bbasc" in Product.SKU ? (Product.Price > 30) : (Product.Price > 100)
    """
    Then [Switch to Basic] is disabled

  