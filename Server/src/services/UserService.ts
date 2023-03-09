import { UserModel } from "../db/UserModel"
import { ObjectId, DiscordId, GoogleId } from "../types"

export abstract class UserService {
  abstract initialize(): Promise<void>

  abstract findOneById(id: ObjectId): Promise<UserModel | undefined>

  abstract findOneByEmail(email: string): Promise<UserModel | undefined>

  abstract findOneByDiscordId(id: DiscordId): Promise<UserModel | undefined>

  abstract findOneByGoogleId(id: GoogleId): Promise<UserModel | undefined>

  abstract signUp(email: string, password: string): Promise<UserModel>

  abstract signIn(email: string, password: string): Promise<UserModel>

  abstract save(user: UserModel): Promise<void>

  abstract getAll(): Promise<UserModel[]>

  abstract deleteAll(): Promise<void>
}
