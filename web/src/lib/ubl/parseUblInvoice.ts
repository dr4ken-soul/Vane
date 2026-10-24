import { XMLParser } from "fast-xml-parser";

/**
 * Private witness values extracted from a UBL 2.1 invoice.
 *
 * Every field in this structure never leaves browser memory. Only the derived proof and the
 * four public circuit inputs are ever transmitted.
 */
export interface UblInvoiceWitness {
  /** Invoice serial taken from `cbc:ID`. */
  invoiceSerial: string;
  /** Supplier legal name. */
  supplierName: string;
  /** Supplier tax identifier taken from the party tax scheme. */
  supplierTaxId: string;
  /** Buyer legal name. */
  customerName: string;
  /** Invoice currency code. */
  currency: string;
  /** Unit price in cents, kept private. */
  unitPriceCents: number;
  /** Invoice line total in cents, kept private. */
  totalAmountCents: number;
  /** Clean kilowatt hours allocated from the certified facility. */
  cleanKwhAllocated: number;
  /** Total clean kilowatt hours in the facility batch that anchors the Merkle tree. */
  cleanBatchKwh: number;
  /** Grid kilowatt hours drawn by the production step. */
  gridKwhAllocated: number;
  /** Grid emission factor in grams of CO2 equivalent per kilowatt hour. */
  gridEmissionFactorGPerKwh: number;
  /** Shipment mass in kilograms. */
  shipmentMassKg: number;
  /** Direct process emissions in kilograms of CO2 equivalent. */
  directProcessEmissionsKg: number;
  /** Declared CBAM ceiling in kilograms of CO2 equivalent per tonne. */
  maxIntensityKgPerTonne: number;
  /** Combined Nomenclature commodity code. */
  cnCommodityCode: number;
  /** Facility latitude in decimal degrees. */
  facilityLatitude: number;
  /** Facility longitude in decimal degrees. */
  facilityLongitude: number;
  /** Facility smart meter identifier. */
  facilityMeterId: string;
  /** Optional pre-anchored facility Merkle root from the invoice extension. */
  facilityRootHex: string | null;
}

/**
 * Parsed invoice with both private witness values and derived public values.
 */
export interface ParsedUblInvoice {
  /** Private witness values. */
  witness: UblInvoiceWitness;
  /** Shipment mass expressed in tonnes. */
  shipmentMassTonnes: number;
  /** Indirect emissions in kilograms of CO2 equivalent. */
  indirectEmissionsKg: number;
  /** Total embedded emissions in kilograms of CO2 equivalent. */
  totalEmissionsKg: number;
  /** Actual embedded intensity in kilograms of CO2 equivalent per tonne. */
  actualIntensityKgPerTonne: number;
  /** True when the actual intensity sits at or below the declared ceiling. */
  withinDeclaredCeiling: boolean;
}

/**
 * Validation problem found while reading an invoice.
 */
export interface UblParseError {
  /** Machine readable field name. */
  field: string;
  /** Human readable recovery instruction. */
  message: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

/**
 * Returns the first element of a possibly repeated node.
 *
 * @param node Parsed node value.
 * @returns The first child object or an empty object.
 */
function first(node: unknown): Record<string, unknown> {
  if (Array.isArray(node)) {
    return (node[0] ?? {}) as Record<string, unknown>;
  }
  if (node && typeof node === "object") {
    return node as Record<string, unknown>;
  }
  return {};
}

/**
 * Reads a text value from a node.
 *
 * @param node Parsed node value.
 * @returns The trimmed text or an empty string.
 */
function text(node: unknown): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node.trim();
  if (typeof node === "number") return String(node);
  const record = first(node);
  const value = record["#text"];
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}

/**
 * Reads a numeric value from a node.
 *
 * @param node Parsed node value.
 * @returns The parsed number or zero.
 */
function numeric(node: unknown): number {
  const raw = text(node).replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Converts a currency amount into cents.
 *
 * @param amount Amount in major currency units.
 * @returns Amount in cents.
 */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Extracts the private witness and derived compliance values from a UBL 2.1 invoice.
 *
 * @param xml Raw invoice XML.
 * @returns The parsed invoice together with any validation problems.
 */
export function parseUblInvoice(xml: string): {
  invoice: ParsedUblInvoice | null;
  errors: UblParseError[];
} {
  const errors: UblParseError[] = [];

  let document: Record<string, unknown>;
  try {
    document = first(parser.parse(xml));
  } catch {
    return {
      invoice: null,
      errors: [
        {
          field: "file",
          message: "The file could not be parsed as XML. Open the invoice in a text editor and confirm the document is well formed.",
        },
      ],
    };
  }

  const invoiceNode = first(document.Invoice);
  const supplierParty = first(first(invoiceNode.AccountingSupplierParty).Party);
  const customerParty = first(first(invoiceNode.AccountingCustomerParty).Party);
  const taxScheme = first(supplierParty.PartyTaxScheme);
  const legalEntity = first(supplierParty.PartyLegalEntity);
  const lineNode = first(invoiceNode.InvoiceLine);
  const itemNode = first(lineNode.Item);
  const priceNode = first(lineNode.Price);
  const classification = first(itemNode.CommodityClassification);
  const monetaryTotal = first(invoiceNode.LegalMonetaryTotal);
  const allocationNode = first(lineNode.EnergyAllocation);

  const invoiceSerial = text(invoiceNode.ID);
  const supplierName = text(legalEntity.RegistrationName) || text(supplierParty.Name);
  const supplierTaxId = text(taxScheme.CompanyID);
  const customerName = text(first(customerParty.PartyLegalEntity).RegistrationName);
  const currency = text(invoiceNode.DocumentCurrencyCode) || "EUR";
  const unitPrice = numeric(priceNode.PriceAmount);
  const totalAmount = numeric(monetaryTotal.LineExtensionAmount);
  const cleanKwhAllocated = numeric(allocationNode.CleanKwhAllocated);
  const declaredBatchKwh = numeric(allocationNode.CleanBatchKwh);
  const cleanBatchKwh = declaredBatchKwh > 0 ? declaredBatchKwh : cleanKwhAllocated;
  const gridKwhAllocated = numeric(allocationNode.GridKwhAllocated);
  const gridEmissionFactorGPerKwh = numeric(allocationNode.GridEmissionFactorGPerKwh);
  const shipmentMassKg = numeric(allocationNode.ShipmentMassKg);
  const directProcessEmissionsKg = numeric(allocationNode.DirectProcessEmissionsKg);
  const maxIntensityKgPerTonne = numeric(allocationNode.MaxIntensityKgPerTonne);
  const cnCommodityCode = Math.round(numeric(classification.ItemClassificationCode));
  const facilityLatitude = numeric(allocationNode.FacilityLatitude);
  const facilityLongitude = numeric(allocationNode.FacilityLongitude);
  const facilityMeterId = text(allocationNode.FacilityMeterId);
  const facilityRootRaw = text(allocationNode.FacilityRoot);

  if (!invoiceSerial) {
    errors.push({
      field: "invoiceSerial",
      message: "Add a unique invoice number in cbc:ID before generating a proof.",
    });
  }
  if (!supplierTaxId) {
    errors.push({
      field: "supplierTaxId",
      message: "Add the supplier tax identifier in cac:PartyTaxScheme/cbc:CompanyID before generating a proof.",
    });
  }
  if (unitPrice <= 0) {
    errors.push({
      field: "unitPrice",
      message: "Set a positive unit price in cac:Price/cbc:PriceAmount before generating a proof.",
    });
  }
  if (cleanKwhAllocated <= 0) {
    errors.push({
      field: "cleanKwhAllocated",
      message: "Set the allocated clean energy in vane:CleanKwhAllocated before generating a proof.",
    });
  }
  if (shipmentMassKg <= 0) {
    errors.push({
      field: "shipmentMassKg",
      message: "Set the shipment mass in vane:ShipmentMassKg before generating a proof.",
    });
  }
  if (directProcessEmissionsKg < 0) {
    errors.push({
      field: "directProcessEmissionsKg",
      message: "The direct process emissions in vane:DirectProcessEmissionsKg cannot be negative.",
    });
  }
  if (maxIntensityKgPerTonne <= 0) {
    errors.push({
      field: "maxIntensityKgPerTonne",
      message: "Set the declared CBAM ceiling in vane:MaxIntensityKgPerTonne before generating a proof.",
    });
  }
  if (cnCommodityCode <= 0) {
    errors.push({
      field: "cnCommodityCode",
      message: "Set the commodity CN code in cac:CommodityClassification/cbc:ItemClassificationCode before generating a proof.",
    });
  }

  if (errors.length > 0) {
    return { invoice: null, errors };
  }

  const shipmentMassTonnes = Math.floor(shipmentMassKg / 1000);
  const indirectEmissionsKg = Math.floor(
    (gridKwhAllocated * gridEmissionFactorGPerKwh) / 1000,
  );
  const totalEmissionsKg = directProcessEmissionsKg + indirectEmissionsKg;
  const maxAllowedTotalKg = maxIntensityKgPerTonne * shipmentMassTonnes;
  const actualIntensityKgPerTonne =
    shipmentMassTonnes > 0 ? totalEmissionsKg / shipmentMassTonnes : Number.POSITIVE_INFINITY;

  return {
    invoice: {
      witness: {
        invoiceSerial,
        supplierName,
        supplierTaxId,
        customerName,
        currency,
        unitPriceCents: toCents(unitPrice),
        totalAmountCents: toCents(totalAmount),
        cleanKwhAllocated: Math.round(cleanKwhAllocated),
        cleanBatchKwh: Math.round(cleanBatchKwh),
        gridKwhAllocated: Math.round(gridKwhAllocated),
        gridEmissionFactorGPerKwh: Math.round(gridEmissionFactorGPerKwh),
        shipmentMassKg: Math.round(shipmentMassKg),
        directProcessEmissionsKg: Math.round(directProcessEmissionsKg),
        maxIntensityKgPerTonne: Math.round(maxIntensityKgPerTonne),
        cnCommodityCode,
        facilityLatitude,
        facilityLongitude,
        facilityMeterId,
        facilityRootHex: facilityRootRaw.length > 0 ? facilityRootRaw : null,
      },
      shipmentMassTonnes,
      indirectEmissionsKg,
      totalEmissionsKg,
      actualIntensityKgPerTonne: Number(actualIntensityKgPerTonne.toFixed(2)),
      withinDeclaredCeiling: totalEmissionsKg <= maxAllowedTotalKg,
    },
    errors,
  };
}
