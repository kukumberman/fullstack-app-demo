import { UserSchema } from "../types"
import { SimpleDatabase } from "./SimpleDatabase"

export class UserDatabase extends SimpleDatabase<UserSchema> {}
