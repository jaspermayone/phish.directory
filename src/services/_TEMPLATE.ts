// import axios from "axios";

/**
 * A service that provides access to the TEMPLATE service for checking and reporting domains.
 */
export class TEMPLATEService {
  /**
   * Asynchronously checks a given domain against the TEMPLATE service for any known bad domains.
   *
   * @param {string} domain - The domain name to be checked.
   * @returns
   */
  async check(domain: string) {}

  /**
   * Asynchronously reports a given domain to the TEMPLATE service for further processing or analysis.
   *
   * @param {string} domain - The domain name to be reported.
   * @returns
   */
  async report(domain: string) {
    // todo: implement this
  }
}