import axios from "axios";
import metrics from "../metrics";

/**
 * A service that provides access to the VirusTotal service for checking and reporting domains.
 */
export class VirusTotalService {
  /**
   * Asynchronously checks a given domain against the VirusTotal service for any known bad domains.
   *
   * @param {string} domain - The domain name to be checked.
   * @param {} prisma - The Prisma client instance to use for database operations.
   * @returns
   */
  async check(domain: string, prisma: any) {
    metrics.increment("domain.check.api.virustotal");

    const response = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: {
          "x-apikey": process.env.VIRUS_TOTAL_API_KEY!,
          Referer: "https://phish.directory",
          "User-Agent": "internal-server@phish.directory",
          "X-Identity": "internal-server@phish.directory",
        },
      },
    );

    return response.data;
  }

  /**
   * Asynchronously reports a given domain to the VirusTotal service for further processing or analysis.
   *
   * @param {string} domain - The domain name to be reported.
   * @param {} prisma - The Prisma client instance to use for database operations.
   * @returns
   */
  async report(domain: string, prisma: any) {
    metrics.increment("domain.report.api.virustotal");

    const commentData = {
      data: {
        type: "comment",
        attributes: {
          text: "This website is present on the phish.directory anti phishing list. More info at https://phish.directory or via email at team@phish.directory",
        },
      },
    };

    axios
      .post(
        `https://www.virustotal.com/api/v3/domains/${domain}/comments`,
        commentData,
        {
          headers: {
            accept: "application/json",
            "x-apikey": process.env.VIRUS_TOTAL_API_KEY!,
            "content-type": "application/json",
            Referer: "https://phish.directory",
            "User-Agent": "internal-server@phish.directory",
            "X-Identity": "internal-server@phish.directory",
          },
        },
      )
      .then((response) => {
        // console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

    const voteData = {
      data: {
        type: "vote",
        attributes: {
          verdict: "malicious",
        },
      },
    };

    axios
      .post(
        `https://www.virustotal.com/api/v3/domains/${domain}/comments`,
        voteData,
        {
          headers: {
            accept: "application/json",
            "x-apikey": process.env.VIRUS_TOTAL_API_KEY!,
            "content-type": "application/json",
            Referer: "https://phish.directory",
            "User-Agent": "internal-server@phish.directory",
            "X-Identity": "internal-server@phish.directory",
          },
        },
      )
      .then((response) => {
        // console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

    // todo: implement this
  }
}
