import { UserModel } from "../src/db/UserModel"
import { ApplicationEnvironment } from "../src/enums"
import { CustomError, ErrorType } from "../src/errors"
import { UserServiceImpl } from "../src/services/UserServiceImpl"

const userService = new UserServiceImpl(ApplicationEnvironment.Test)

beforeAll(async () => {
  await userService.initialize()
})

beforeEach(async () => {
  await userService.deleteAll()
})

describe("UserServiceImpl", () => {
  it("has no user by default", async () => {
    const users = await userService.getAll()
    expect(users.length).toEqual(0)
  })

  it("successfully creates user", async () => {
    const user = UserModel.New()
    await userService.save(user)
    const users = await userService.getAll()
    expect(users.length).toEqual(1)
  })

  it("successfully deletes all entries", async () => {
    await userService.save(UserModel.New())
    await userService.save(UserModel.New())

    const users = await userService.getAll()
    expect(users.length).toEqual(2)

    await userService.deleteAll()
    const usersAfterDeletion = await userService.getAll()
    expect(usersAfterDeletion.length).toEqual(0)
  })

  it("successfully find user by id", async () => {
    const user = UserModel.New()
    await userService.save(user)

    const candidate: UserModel | undefined = await userService.findOneById(user.id)
    expect(candidate).toBeDefined()
    expect(candidate?.id).toEqual(user.id)
  })

  it("fails to find non existing user by id", async () => {
    const user = UserModel.New()
    await userService.save(user)
    const candidate: UserModel | undefined = await userService.findOneById("INVALID_ID")
    expect(candidate).toBeUndefined()
  })

  it("fails to sign-up with invalid email", async () => {
    const promise = userService.signUp("", "123")
    await expect(promise).rejects.toEqual(new CustomError(400, ErrorType.SignUpInvalidEmail))
  })

  it("fails to sign-up with invalid password", async () => {
    const promise = userService.signUp("test@mail.com", "")
    await expect(promise).rejects.toEqual(new CustomError(400, ErrorType.SignUpInvalidPassword))
  })

  it("successfully sign-ups with valid credentials", async () => {
    const email = "test@mail.com"
    const password = "123"
    const promise = userService.signUp(email, password)
    await expect(promise).resolves.toHaveProperty("data.signIn.standard.email", email)
  })

  it("fails to sign-up with same email", async () => {
    const email = "test@mail.com"
    const password = "123"
    const password2 = "456"

    const user = await userService.signUp(email, password)
    await userService.save(user)

    const promise = userService.signUp(email, password2)
    await expect(promise).rejects.toEqual(new CustomError(400, ErrorType.SignUpUserAlreadyExists))
  })

  it("successfully sign-ins after sign-up with same credentials", async () => {
    const email = "test@mail.com"
    const password = "123"

    const user = await userService.signUp(email, password)
    await userService.save(user)

    const promise = userService.signIn(email, password)
    await expect(promise).resolves.toHaveProperty("data.id", user.id)
  })

  it("fails to sign-in with non existing email", async () => {
    const email = "invalid@mail.com"
    const password = "123"
    const promise = userService.signIn(email, password)
    await expect(promise).rejects.toEqual(
      new CustomError(400, ErrorType.SignInNoUserWithGivenEmail)
    )
  })

  it("fails to sign-in with wrong password", async () => {
    const email = "test@mail.com"
    const password = "123"
    const wrongPassword = "456"

    const user = await userService.signUp(email, password)
    await userService.save(user)

    const promise = userService.signIn(email, wrongPassword)
    await expect(promise).rejects.toEqual(new CustomError(400, ErrorType.SignInWrongPassword))
  })

  it.todo("findOneByEmail")

  it.todo("findOneByDiscordId")

  it.todo("findOneByGoogleId")
})
