
/*
export interface ICenter {
  id: number | undefined;
  name: string;
  city: string;
  managerName: string;
  phone: string;
  email: string;
  address: string;
  photo ? : string;
  showDetails ? : boolean;
  // managerID: number | undefined;
  // manager: Person | undefined;
}
*/
export default class Center {
  public id: number | undefined = undefined;
  public name: string = "";
  public city: string = "";
  managerName: string = "";
  public phone: string = "";
  public email: string = "";
  public address: string = "";
  public photo ? : string = "";
  public showDetails: boolean = false;
  // public managerID: number | undefined = undefined;
  // public manager: Person | undefined = undefined;
  /*   constructor(name: string, city: string, managerID: number | undefined, phone: string, email: string, address: string, id ? : number | undefined, manager ? : Person | undefined, photo ? : string, showDetails ? : boolean) {
     
    } */

  // constructor(obj: ICenter);
  constructor({ name, city, managerName, phone, email, address, id, photo, showDetails }: { name: string, city: string, managerName: string, phone: string, email: string, address: string, id ? : number | undefined, photo ? : string, showDetails ? : boolean }) {
    this.id = id
    this.managerName = managerName
    this.name = name
    this.city = city
    this.phone = phone
    this.email = email
    this.address = address
    this.photo = photo
    this.showDetails = (showDetails != undefined) ? showDetails : false
    // this.managerID = managerID
    // this.manager = manager
  }

  // public getManagerFullName(): string {
  //   if (this.manager && this.manager.firstName) {
  //     return this.manager.firstName + " " + this.manager.lastName
  //   } else {
  //     return ""
  //   }
  // }

  public static getInitialCenter(): Center {
    return new Center({ id: undefined, managerName: "", name: "", phone: "", email: "", address: "", city: "", photo: "", showDetails: false })
  }

  // Clears the center data
  public clear(): void {
    Object.assign(this, Center.getInitialCenter())
  }

  /**
   * getName gets the center name
   */
  public getName(): string {
    return this.name
  }

  /**
   * setName sets the center name
   */
  public setName(name: string): void {
    this.name = name
  }
  /**
   * getCity gets the center city
   */
  public getCity(): string {
    return this.city
  }

  /**
   * setCity sets the center city
   */
  public setCity(city: string): void {
    this.city = city
  }

  /**
   * getPhone gets the center phone
   */
  public getPhone(): string {
    return this.phone
  }

  /**
   * setPhone sets the center phone
   */
  public setPhone(phone: string): void {
    this.phone = phone
  }
  /**
   * getEmail gets the center email
   */
  public getEmail(): string {
    return this.email
  }

  /**
   * setEmail sets the center email
   */
  public setEmail(email: string): void {
    this.email = email
  }
  /**
   * getAddress gets the center address
   */
  public getAddress(): string {
    return this.address
  }

  /**
   * setAddress sets the center address
   */
  public setAddress(address: string): void {
    this.address = address
  }
  /**
   * getShowDetails gets the center showDetails
   */
  public getShowDetails(): boolean {
    return this.showDetails
  }

  /**
   * setShowDetails sets the center showDetails
   */
  public setShowDetails(showDetails: boolean): void {
    this.showDetails = showDetails
  }

  /**
   * getPhoto returns the center photo
   */
  public getPhoto(): string {
    if (this.photo != undefined && this.photo != "") {
      return this.photo
    } else {
      return ""
    }
  }

  /**
   * setPhoto sets the center photo
   */
  public setPhoto(photoPath: string): void {
    this.photo = photoPath
  }

}