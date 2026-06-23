import type { Patient } from "@prisma/client";
import type { PatientFormValues } from "./patient-schema";

/** Convert a persisted patient into wizard form values (for editing). */
export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    documentTypeId: patient.documentTypeId,
    documentNumber: patient.documentNumber,
    firstName: patient.firstName,
    secondName: patient.secondName ?? "",
    firstSurname: patient.firstSurname,
    secondSurname: patient.secondSurname ?? "",
    birthDate: patient.birthDate.toISOString().slice(0, 10),
    sexCatalogValueId: patient.sexCatalogValueId,
    active: patient.active,
    fixedPhone: patient.fixedPhone ?? "",
    mobilePhone: patient.mobilePhone ?? "",
    email: patient.email ?? "",
    noEmail: patient.noEmail,
    address: patient.address ?? "",
    cityCatalogValueId: patient.cityCatalogValueId ?? "",
    cityOther: patient.cityOther ?? "",
    residentialZoneCatalogValueId: patient.residentialZoneCatalogValueId ?? "",
    nationalityCatalogValueId: patient.nationalityCatalogValueId ?? "",
    nationalityOther: patient.nationalityOther ?? "",
    userTypeCatalogValueId: patient.userTypeCatalogValueId ?? "",
    insurerCatalogValueId: patient.insurerCatalogValueId ?? "",
    patientOriginCatalogValueId: patient.patientOriginCatalogValueId ?? "",
    treatmentCatalogValueId: patient.treatmentCatalogValueId ?? "",
    documentExpeditionCityCatalogValueId:
      patient.documentExpeditionCityCatalogValueId ?? "",
    entityCatalogValueId: patient.entityCatalogValueId ?? "",
    planCatalogValueId: patient.planCatalogValueId ?? "",
    habeasDataAccepted: patient.habeasDataAccepted,
  };
}
