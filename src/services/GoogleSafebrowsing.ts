import axios from "axios";
import metrics from "../metrics";

/**
 * A service that provides access to the Google Safebrowsing for checking and reporting domains.
 */
export class GoogleSafebrowsingService {
  /**
   * Asynchronously checks a given domain against the google safebrowsing service for any known bad domains.
   *
   * @param {string} domain - The domain name to be checked.
   * @param {} prisma - The Prisma client instance to use for database operations.
   * @returns
   */
  async check(domain: string, prisma: any) {
    metrics.increment("domain.check.api.google_safebrowsing");

    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process
        .env.GOOGLE_API_KEY!}`,
      {
        client: {
          clientId: `phish.directory`,
          clientVersion: `${process.env.npm_package_version!}`,
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [
            {
              url: domain,
            },
          ],
        },
      },
    );

    return response.data;
  }
}
