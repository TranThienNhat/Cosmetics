import { BaseModel } from "../core/BaseModel";
import { IUser } from "../interfaces/User";

class UserModel extends BaseModel<IUser> {
  constructor() {
    super("users");
  }
}

export default new UserModel();
