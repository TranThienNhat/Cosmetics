import { BaseModel } from "../core/BaseModel";
import { ISupplier } from "../interfaces/Supplier";

class SupplierModel extends BaseModel<ISupplier> {
  constructor() {
    super("suppliers");
  }

  async findByEmail(email: string): Promise<ISupplier | null> {
    return this.findOne({ email } as Partial<ISupplier>);
  }
}

export const Supplier = new SupplierModel();