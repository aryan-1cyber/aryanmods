/*
 * DEALS
 * -----
 * EarnKaro (and Cuelinks) do not serve ads — they give you a *tracked product
 * link* that pays a commission when someone buys through it. This file is the
 * list of those links, rendered as deal cards on the home page.
 *
 * To turn a sample card into a real earner:
 *   1. open the EarnKaro app / site -> "Create Link" (or paste a product URL)
 *   2. copy the https://earnkaro.com/... link it gives you
 *   3. paste it as `url` below
 *   4. update merchant / title / note / price to match the actual product
 *
 * Fields:
 *   merchant  shop name, shown in the tile and the tag
 *   title     one line, what the deal is
 *   note      optional second line
 *   price     optional, e.g. "₹1,299" — only put the real price
 *   was       optional, original price, e.g. "₹1,999"
 *   url       your tracked link (http/https only; anything else is ignored)
 *   accent    tile colour when there is no image
 *   image     optional product image URL (https only)
 *
 * `enabled: false` hides the whole section, disclosure included.
 */
window.DEALS = {
  enabled: true,
  title: "Deals",
  disclose:
    "Deal links are affiliate links. If you buy through them, aryanmods may earn a commission at no extra cost to you. Prices and availability are set by the shop.",

  items: [
    {
      merchant: "Flipkart",
      title: "Electronics and accessory offers",
      note: "Phones, earbuds, chargers",
      url: "https://www.flipkart.com/offers-store",
      accent: "#2874f0"
    },
    {
      merchant: "Amazon",
      title: "Today's deals",
      note: "Limited-time price drops",
      url: "https://www.amazon.in/deals",
      accent: "#ff9900"
    },
    {
      merchant: "Myntra",
      title: "Fashion and footwear offers",
      note: "Seasonal sale picks",
      url: "https://www.myntra.com/",
      accent: "#ff3f6c"
    },
    {
      merchant: "Ajio",
      title: "New arrivals and offers",
      note: "Everyday wear and basics",
      url: "https://www.ajio.com/",
      accent: "#2b2b2b"
    }
  ]
};
