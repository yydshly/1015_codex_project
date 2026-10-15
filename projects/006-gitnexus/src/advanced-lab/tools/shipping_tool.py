from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Shipping research fixture")


@mcp.tool()
def quote_shipping(subtotal: int) -> dict:
    """Quote a local shipping fee in integer cents."""
    shipping = 0 if subtotal >= 10000 else 500
    return {"shipping": shipping, "total": subtotal + shipping}
