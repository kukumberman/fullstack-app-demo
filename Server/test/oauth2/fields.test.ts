import { DiscordOAuth2Handler, GoogleOAuth2Handler } from "../../src/auth/OAuth2Handler"

/**
 * @api https://www.googleapis.com/oauth2/v2/userinfo
 * @docs https://any-api.com/googleapis_com/oauth2/docs/userinfo/oauth2_userinfo_get
 */
const googleFields_v2 = {
  id: "",
  email: "",
  verified_email: true,
  name: "",
  given_name: "",
  family_name: "",
  picture: "",
  locale: "",
}

/**
 * @api https://www.googleapis.com/oauth2/v3/userinfo
 * @docs https://developers.google.com/identity/openid-connect/openid-connect#an-id-tokens-payload
 */
const googleFields_v3 = {
  sub: "",
  name: "",
  given_name: "",
  family_name: "",
  picture: "",
  email: "",
  email_verified: true,
  locale: "",
}

/**
 * @api https://discord.com/api/users/@me
 * @docs https://discord.com/developers/docs/resources/user#user-object-user-structure
 */
const discordFields = {
  id: "",
  username: "",
  display_name: null,
  avatar: "",
  avatar_decoration: null,
  discriminator: "",
  public_flags: 0,
  flags: 0,
  banner: null,
  banner_color: null,
  accent_color: null,
  locale: "",
  mfa_enabled: false,
  premium_type: 0,
}

describe("fields validation", () => {
  it("successfully validates google fields", () => {
    const handler = new GoogleOAuth2Handler()
    const result = handler.isDataValid(googleFields_v2)
    expect(result).toBe(true)
  })

  it("successfully validates discord fields", () => {
    const handler = new DiscordOAuth2Handler()
    const result = handler.isDataValid(discordFields)
    expect(result).toBe(true)
  })
})
