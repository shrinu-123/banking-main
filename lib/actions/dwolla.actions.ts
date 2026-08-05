"use server";

import { Client } from "dwolla-v2";

// Validate environment variables
const getEnvironment = (): "sandbox" | "production" => {
  const environment = process.env.DWOLLA_ENV?.trim().toLowerCase();

  console.log("DWOLLA_ENV:", environment);

  if (environment === "sandbox") {
    return "sandbox";
  }

  if (environment === "production") {
    return "production";
  }

  throw new Error(
    `Invalid DWOLLA_ENV: "${environment}". Expected "sandbox" or "production".`
  );
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY!,
  secret: process.env.DWOLLA_SECRET!,
});

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    const response = await dwollaClient.post(
      `customers/${options.customerId}/funding-sources`,
      {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      }
    );

    return response.headers.get("location");
  } catch (error) {
    console.error("Creating Funding Source Failed:", error);
    throw error;
  }
};

// Create On Demand Authorization
export const createOnDemandAuthorization = async () => {
  try {
    const response = await dwollaClient.post("on-demand-authorizations");

    return response.body._links;
  } catch (error) {
    console.error("Creating On Demand Authorization Failed:", error);
    throw error;
  }
};

// Create Dwolla Customer
export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    const response = await dwollaClient.post("customers", newCustomer);

    return response.headers.get("location");
  } catch (error) {
    console.error("Creating Dwolla Customer Failed:", error);
    throw error;
  }
};

// Create Transfer
export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const response = await dwollaClient.post("transfers", {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    });

    return response.headers.get("location");
  } catch (error) {
    console.error("Transfer Failed:", error);
    throw error;
  }
};

// Add Funding Source
export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    const dwollaAuthLinks = await createOnDemandAuthorization();

    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };

    return await createFundingSource(fundingSourceOptions);
  } catch (error) {
    console.error("Adding Funding Source Failed:", error);
    throw error;
  }
};