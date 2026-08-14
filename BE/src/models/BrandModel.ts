import { BaseModel } from "../core/BaseModel";
import { IBrand } from "../interfaces/Brand";

class BrandModel extends BaseModel<IBrand> {
  constructor() {
    super("brands");
  }
}

export default new BrandModel();
