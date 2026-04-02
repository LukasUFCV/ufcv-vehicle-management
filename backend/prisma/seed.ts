import {
  AuthProvider,
  CommentVisibility,
  ConflictStatus,
  InfoEntityType,
  InfoValueType,
  InfoVisibility,
  LocationType,
  NotificationType,
  OdometerEntryType,
  PermissionAction,
  PermissionModule,
  PrismaClient,
  RequestChangeType,
  ReservationStatus,
  RoleKey,
  UserStatus,
  VehicleStatus,
  WorkflowStatus
} from "@prisma/client";
import { env } from "../src/config/env.js";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

const permissionCatalog: Record<PermissionModule, PermissionAction[]> = {
  DASHBOARD: [PermissionAction.ACCESS, PermissionAction.VIEW],
  RESERVATIONS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.PRINT
  ],
  REQUESTS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.VALIDATE,
    PermissionAction.REJECT
  ],
  CONFLICTS: [PermissionAction.VIEW, PermissionAction.MANAGE],
  USER_INFOS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.DELETE,
    PermissionAction.VALIDATE
  ],
  VEHICLE_INFOS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.DELETE,
    PermissionAction.VALIDATE
  ],
  COMMENTS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.DELETE,
    PermissionAction.VALIDATE
  ],
  ODOMETER: [PermissionAction.VIEW, PermissionAction.CREATE],
  VEHICLES: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE,
    PermissionAction.PRINT,
    PermissionAction.SCAN
  ],
  USERS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE
  ],
  LOCATIONS: [
    PermissionAction.VIEW,
    PermissionAction.CREATE,
    PermissionAction.UPDATE,
    PermissionAction.DELETE
  ],
  PERMISSIONS: [PermissionAction.VIEW, PermissionAction.MANAGE],
  NOTIFICATIONS: [PermissionAction.VIEW],
  PERSONAL_PROFILE: [PermissionAction.VIEW, PermissionAction.UPDATE],
  FILES: [PermissionAction.VIEW, PermissionAction.CREATE]
};

const roleGrants: Record<RoleKey, Array<[PermissionModule, PermissionAction, string]>> = {
  POTENTIAL_USER: [
    [PermissionModule.DASHBOARD, PermissionAction.VIEW, "ALL"],
    [PermissionModule.PERSONAL_PROFILE, PermissionAction.VIEW, "SELF"],
    [PermissionModule.PERSONAL_PROFILE, PermissionAction.UPDATE, "SELF"],
    [PermissionModule.NOTIFICATIONS, PermissionAction.VIEW, "SELF"]
  ],
  USER: [
    [PermissionModule.DASHBOARD, PermissionAction.VIEW, "ALL"],
    [PermissionModule.PERSONAL_PROFILE, PermissionAction.VIEW, "SELF"],
    [PermissionModule.PERSONAL_PROFILE, PermissionAction.UPDATE, "SELF"],
    [PermissionModule.NOTIFICATIONS, PermissionAction.VIEW, "SELF"],
    [PermissionModule.RESERVATIONS, PermissionAction.VIEW, "SELF"],
    [PermissionModule.RESERVATIONS, PermissionAction.CREATE, "SELF"],
    [PermissionModule.RESERVATIONS, PermissionAction.UPDATE, "SELF"],
    [PermissionModule.RESERVATIONS, PermissionAction.DELETE, "SELF"],
    [PermissionModule.REQUESTS, PermissionAction.VIEW, "SELF"],
    [PermissionModule.REQUESTS, PermissionAction.CREATE, "SELF"],
    [PermissionModule.VEHICLES, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.VEHICLES, PermissionAction.PRINT, "LOCATION"],
    [PermissionModule.VEHICLES, PermissionAction.SCAN, "LOCATION"],
    [PermissionModule.ODOMETER, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.ODOMETER, PermissionAction.CREATE, "LOCATION"],
    [PermissionModule.USER_INFOS, PermissionAction.VIEW, "SELF"],
    [PermissionModule.USER_INFOS, PermissionAction.CREATE, "SELF"],
    [PermissionModule.USER_INFOS, PermissionAction.DELETE, "SELF"],
    [PermissionModule.VEHICLE_INFOS, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.VEHICLE_INFOS, PermissionAction.CREATE, "LOCATION"],
    [PermissionModule.COMMENTS, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.COMMENTS, PermissionAction.CREATE, "LOCATION"],
    [PermissionModule.FILES, PermissionAction.VIEW, "ALL"],
    [PermissionModule.FILES, PermissionAction.CREATE, "ALL"]
  ],
  APPROVER: [
    [PermissionModule.DASHBOARD, PermissionAction.VIEW, "ALL"],
    [PermissionModule.PERSONAL_PROFILE, PermissionAction.VIEW, "SELF"],
    [PermissionModule.PERSONAL_PROFILE, PermissionAction.UPDATE, "SELF"],
    [PermissionModule.NOTIFICATIONS, PermissionAction.VIEW, "SELF"],
    [PermissionModule.RESERVATIONS, PermissionAction.VIEW, "MANAGER"],
    [PermissionModule.RESERVATIONS, PermissionAction.CREATE, "MANAGER"],
    [PermissionModule.RESERVATIONS, PermissionAction.UPDATE, "MANAGER"],
    [PermissionModule.REQUESTS, PermissionAction.VIEW, "MANAGER"],
    [PermissionModule.REQUESTS, PermissionAction.VALIDATE, "MANAGER"],
    [PermissionModule.REQUESTS, PermissionAction.REJECT, "MANAGER"],
    [PermissionModule.CONFLICTS, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.CONFLICTS, PermissionAction.MANAGE, "LOCATION"],
    [PermissionModule.VEHICLES, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.VEHICLES, PermissionAction.PRINT, "LOCATION"],
    [PermissionModule.USERS, PermissionAction.VIEW, "MANAGER"],
    [PermissionModule.USER_INFOS, PermissionAction.VIEW, "MANAGER"],
    [PermissionModule.USER_INFOS, PermissionAction.VALIDATE, "MANAGER"],
    [PermissionModule.VEHICLE_INFOS, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.VEHICLE_INFOS, PermissionAction.VALIDATE, "LOCATION"],
    [PermissionModule.COMMENTS, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.COMMENTS, PermissionAction.VALIDATE, "LOCATION"],
    [PermissionModule.ODOMETER, PermissionAction.VIEW, "LOCATION"],
    [PermissionModule.FILES, PermissionAction.VIEW, "ALL"],
    [PermissionModule.FILES, PermissionAction.CREATE, "ALL"]
  ],
  ADMIN: []
};

function buildAdminGrants() {
  const grants: Array<[PermissionModule, PermissionAction, string]> = [];

  for (const [module, actions] of Object.entries(permissionCatalog) as Array<
    [PermissionModule, PermissionAction[]]
  >) {
    actions.forEach((action) => {
      grants.push([module, action, "ALL"]);
    });
  }

  return grants;
}

roleGrants.ADMIN = buildAdminGrants();

async function createLocationHierarchy(locationByCode: Record<string, { id: string; parentCode?: string }>) {
  for (const location of Object.values(locationByCode)) {
    const chain: string[] = [];
    let current: { id: string; parentCode?: string } | undefined = location;

    while (current) {
      chain.unshift(current.id);
      current = current.parentCode ? locationByCode[current.parentCode] : undefined;
    }

    for (let depth = 0; depth < chain.length; depth += 1) {
      await prisma.locationHierarchy.create({
        data: {
          ancestorId: chain[depth],
          descendantId: location.id,
          depth: chain.length - depth - 1
        }
      });
    }
  }
}

async function main() {
  await prisma.reminderJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.tripLog.deleteMany();
  await prisma.vehicleOdometerLog.deleteMany();
  await prisma.vehicleCommentRequest.deleteMany();
  await prisma.vehicleComment.deleteMany();
  await prisma.vehicleInfoRequest.deleteMany();
  await prisma.vehicleInfo.deleteMany();
  await prisma.userInfoRequest.deleteMany();
  await prisma.userInfo.deleteMany();
  await prisma.infoType.deleteMany();
  await prisma.reservationConflict.deleteMany();
  await prisma.reservationHistory.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.reservationRequest.deleteMany();
  await prisma.analyticsCode.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.vehicleStatusHistory.deleteMany();
  await prisma.vehicleQrCode.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicleLocation.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.locationHierarchy.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.managerRelationship.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  const permissionRecords: Array<{ module: PermissionModule; action: PermissionAction; label: string }> = [];

  for (const [module, actions] of Object.entries(permissionCatalog) as Array<
    [PermissionModule, PermissionAction[]]
  >) {
    actions.forEach((action) => {
      permissionRecords.push({
        module,
        action,
        label: `${module} ${action}`
      });
    });
  }

  await prisma.permission.createMany({
    data: permissionRecords
  });

  const permissions = await prisma.permission.findMany();
  const permissionMap = new Map(
    permissions.map((permission) => [`${permission.module}:${permission.action}`, permission.id])
  );

  const roles = await Promise.all(
    [
      {
        key: RoleKey.POTENTIAL_USER,
        name: "Utilisateur potentiel",
        description: "Accès limité en attente d'activation métier."
      },
      {
        key: RoleKey.USER,
        name: "Utilisateur courant",
        description: "Utilisation standard pour réservations et données personnelles."
      },
      {
        key: RoleKey.APPROVER,
        name: "Approbateur",
        description: "Validation des demandes et visibilité sur les personnes rattachées."
      },
      {
        key: RoleKey.ADMIN,
        name: "Administrateur",
        description: "Administration globale de l'application."
      }
    ].map((role) =>
      prisma.role.create({
        data: {
          ...role,
          isSystem: true
        }
      })
    )
  );

  const roleMap = new Map(roles.map((role) => [role.key, role.id]));

  for (const [roleKey, grants] of Object.entries(roleGrants) as Array<
    [RoleKey, Array<[PermissionModule, PermissionAction, string]>]
  >) {
    await prisma.rolePermission.createMany({
      data: grants.map(([module, action, scope]) => ({
        roleId: roleMap.get(roleKey)!,
        permissionId: permissionMap.get(`${module}:${action}`)!,
        scope
      }))
    });
  }

  const createdLocations = await Promise.all(
    [
      {
        code: "FR",
        name: "UFCV France",
        type: LocationType.NATION,
        attachmentKey: "NATIONAL"
      },
      {
        code: "IDF",
        name: "Ile-de-France",
        type: LocationType.REGION,
        attachmentKey: "IDF",
        parentCode: "FR"
      },
      {
        code: "IDF-PAR",
        name: "Agglomération de Paris",
        type: LocationType.AGGLOMERATION,
        attachmentKey: "IDF-PAR",
        parentCode: "IDF"
      },
      {
        code: "PARIS-12",
        name: "Paris Nation",
        type: LocationType.SITE,
        attachmentKey: "IDF-PAR",
        parentCode: "IDF-PAR"
      },
      {
        code: "AURA",
        name: "Auvergne-Rhone-Alpes",
        type: LocationType.REGION,
        attachmentKey: "AURA",
        parentCode: "FR"
      },
      {
        code: "LYON-MET",
        name: "Agglomération de Lyon",
        type: LocationType.AGGLOMERATION,
        attachmentKey: "AURA-LYO",
        parentCode: "AURA"
      },
      {
        code: "LYON-7",
        name: "Lyon Gerland",
        type: LocationType.SITE,
        attachmentKey: "AURA-LYO",
        parentCode: "LYON-MET"
      }
    ].map((location) =>
      prisma.location.create({
        data: {
          code: location.code,
          name: location.name,
          type: location.type,
          attachmentKey: location.attachmentKey,
          parentId: null
        }
      })
    )
  );

  const locationByCode = Object.fromEntries(
    createdLocations.map((location) => [location.code, { id: location.id }])
  ) as Record<string, { id: string; parentCode?: string }>;

  locationByCode.IDF.parentCode = "FR";
  locationByCode["IDF-PAR"].parentCode = "IDF";
  locationByCode["PARIS-12"].parentCode = "IDF-PAR";
  locationByCode.AURA.parentCode = "FR";
  locationByCode["LYON-MET"].parentCode = "AURA";
  locationByCode["LYON-7"].parentCode = "LYON-MET";

  for (const [, location] of Object.entries(locationByCode)) {
    if (location.parentCode) {
      await prisma.location.update({
        where: { id: location.id },
        data: {
          parentId: locationByCode[location.parentCode].id
        }
      });
    }
  }

  await createLocationHierarchy(locationByCode);

  const adminPassword = await hashPassword(env.SEED_ADMIN_PASSWORD);
  const demoPassword = await hashPassword(env.SEED_DEMO_PASSWORD);

  const [admin, approver, userParis, userLyon, pendingUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: env.SEED_ADMIN_EMAIL,
        professionalEmail: env.SEED_ADMIN_EMAIL,
        passwordHash: adminPassword,
        authProvider: AuthProvider.LOCAL,
        firstName: "Claire",
        lastName: "Admin",
        jobTitle: "Responsable SI",
        phone: "0102030405",
        regionLabel: "National",
        cityLabel: "Paris",
        attachmentKey: "NATIONAL",
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.create({
      data: {
        email: "julien.approbateur@ufcv.local",
        professionalEmail: "julien.approbateur@ufcv.local",
        passwordHash: demoPassword,
        authProvider: AuthProvider.LOCAL,
        firstName: "Julien",
        lastName: "Martin",
        jobTitle: "Coordinateur régional",
        phone: "0611223344",
        regionLabel: "Ile-de-France",
        cityLabel: "Paris",
        attachmentKey: "IDF-PAR",
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.create({
      data: {
        email: "sarah.brunet@ufcv.local",
        professionalEmail: "sarah.brunet@ufcv.local",
        passwordHash: demoPassword,
        authProvider: AuthProvider.LOCAL,
        firstName: "Sarah",
        lastName: "Brunet",
        jobTitle: "Chargée d'activités",
        phone: "0611556677",
        regionLabel: "Ile-de-France",
        cityLabel: "Paris",
        attachmentKey: "IDF-PAR",
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.create({
      data: {
        email: "mehdi.laurent@ufcv.local",
        professionalEmail: "mehdi.laurent@ufcv.local",
        passwordHash: demoPassword,
        authProvider: AuthProvider.LOCAL,
        firstName: "Mehdi",
        lastName: "Laurent",
        jobTitle: "Animateur mobilité",
        phone: "0677889900",
        regionLabel: "Auvergne-Rhone-Alpes",
        cityLabel: "Lyon",
        attachmentKey: "AURA-LYO",
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.create({
      data: {
        email: "ines.potentielle@ufcv.local",
        professionalEmail: "ines.potentielle@ufcv.local",
        passwordHash: demoPassword,
        authProvider: AuthProvider.LOCAL,
        firstName: "Inès",
        lastName: "Roux",
        jobTitle: "Volontaire",
        phone: "0600112233",
        regionLabel: "Ile-de-France",
        cityLabel: "Paris",
        attachmentKey: "IDF-PAR",
        status: UserStatus.PENDING
      }
    })
  ]);

  await prisma.user.update({
    where: { id: userParis.id },
    data: { managerId: approver.id }
  });
  await prisma.user.update({
    where: { id: pendingUser.id },
    data: { managerId: approver.id }
  });

  await prisma.managerRelationship.createMany({
    data: [
      { managerId: approver.id, reportId: userParis.id },
      { managerId: approver.id, reportId: pendingUser.id }
    ]
  });

  await prisma.userLocation.createMany({
    data: [
      { userId: admin.id, locationId: locationByCode.FR.id, isPrimary: true },
      { userId: approver.id, locationId: locationByCode["PARIS-12"].id, isPrimary: true },
      { userId: userParis.id, locationId: locationByCode["PARIS-12"].id, isPrimary: true },
      { userId: userLyon.id, locationId: locationByCode["LYON-7"].id, isPrimary: true },
      { userId: pendingUser.id, locationId: locationByCode["PARIS-12"].id, isPrimary: true }
    ]
  });

  await prisma.userRoleAssignment.createMany({
    data: [
      { userId: admin.id, roleId: roleMap.get(RoleKey.ADMIN)! },
      { userId: approver.id, roleId: roleMap.get(RoleKey.APPROVER)! },
      { userId: userParis.id, roleId: roleMap.get(RoleKey.USER)! },
      { userId: userLyon.id, roleId: roleMap.get(RoleKey.USER)! },
      { userId: pendingUser.id, roleId: roleMap.get(RoleKey.POTENTIAL_USER)! }
    ]
  });

  const [activityMeetings, activityTraining, activityTransport] = await Promise.all([
    prisma.activity.create({ data: { code: "REU", label: "Réunion institutionnelle" } }),
    prisma.activity.create({ data: { code: "FOR", label: "Formation" } }),
    prisma.activity.create({ data: { code: "DEP", label: "Déplacement terrain" } })
  ]);

  const [analyticsA, analyticsB, analyticsC] = await Promise.all([
    prisma.analyticsCode.create({
      data: { code: "A100-PAR", label: "Actions Paris intra-muros" }
    }),
    prisma.analyticsCode.create({
      data: { code: "A210-IDF", label: "Déplacements Ile-de-France" }
    }),
    prisma.analyticsCode.create({
      data: { code: "A330-LYO", label: "Animations agglomération de Lyon" }
    })
  ]);

  const [vehicleParis1, vehicleParis2, vehicleLyon1] = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: "AB-123-CD",
        internalName: "Kangoo Paris 1",
        status: VehicleStatus.AVAILABLE,
        availabilityLabel: "Disponible",
        currentLocationId: locationByCode["PARIS-12"].id,
        attachmentKey: "IDF-PAR",
        type: "Utilitaire léger",
        notes: "Véhicule principal pour les déplacements IDF.",
        inServiceAt: new Date("2022-03-12T00:00:00.000Z")
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "EF-456-GH",
        internalName: "Clio Paris 2",
        status: VehicleStatus.MAINTENANCE,
        availabilityLabel: "En maintenance",
        currentLocationId: locationByCode["PARIS-12"].id,
        attachmentKey: "IDF-PAR",
        type: "Citadine",
        notes: "Révision freinage prévue.",
        inServiceAt: new Date("2021-09-05T00:00:00.000Z")
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "JK-789-LM",
        internalName: "Partner Lyon",
        status: VehicleStatus.AVAILABLE,
        availabilityLabel: "Disponible",
        currentLocationId: locationByCode["LYON-7"].id,
        attachmentKey: "AURA-LYO",
        type: "Utilitaire",
        notes: "Kit hiver disponible dans le coffre.",
        inServiceAt: new Date("2020-06-19T00:00:00.000Z")
      }
    })
  ]);

  await prisma.vehicleLocation.createMany({
    data: [
      { vehicleId: vehicleParis1.id, locationId: locationByCode["PARIS-12"].id, isPrimary: true },
      { vehicleId: vehicleParis2.id, locationId: locationByCode["PARIS-12"].id, isPrimary: true },
      { vehicleId: vehicleLyon1.id, locationId: locationByCode["LYON-7"].id, isPrimary: true }
    ]
  });

  await prisma.vehicleStatusHistory.createMany({
    data: [
      {
        vehicleId: vehicleParis1.id,
        changedById: admin.id,
        status: VehicleStatus.AVAILABLE,
        note: "Création du parc"
      },
      {
        vehicleId: vehicleParis2.id,
        changedById: admin.id,
        status: VehicleStatus.MAINTENANCE,
        note: "Entretien planifié"
      },
      {
        vehicleId: vehicleLyon1.id,
        changedById: admin.id,
        status: VehicleStatus.AVAILABLE,
        note: "Création du parc"
      }
    ]
  });

  const reservationA = await prisma.reservation.create({
    data: {
      userId: userParis.id,
      vehicleId: vehicleParis1.id,
      activityId: activityMeetings.id,
      analyticsCodeId: analyticsA.id,
      departureAt: new Date("2026-04-07T08:00:00.000Z"),
      arrivalAt: new Date("2026-04-07T12:00:00.000Z"),
      departureLocationId: locationByCode["PARIS-12"].id,
      arrivalLocationId: locationByCode["PARIS-12"].id,
      destination: "Réunion siège national",
      status: ReservationStatus.CONFLICTED,
      createdById: userParis.id,
      notes: "Matériel de présentation à transporter."
    }
  });

  const reservationB = await prisma.reservation.create({
    data: {
      userId: approver.id,
      vehicleId: vehicleParis1.id,
      activityId: activityTraining.id,
      analyticsCodeId: analyticsB.id,
      departureAt: new Date("2026-04-07T10:30:00.000Z"),
      arrivalAt: new Date("2026-04-07T15:00:00.000Z"),
      departureLocationId: locationByCode["PARIS-12"].id,
      arrivalLocationId: locationByCode["PARIS-12"].id,
      destination: "Formation coordinateurs IDF",
      status: ReservationStatus.CONFLICTED,
      createdById: approver.id,
      notes: "Conflit volontaire pour démonstration."
    }
  });

  const reservationC = await prisma.reservation.create({
    data: {
      userId: userLyon.id,
      vehicleId: vehicleLyon1.id,
      activityId: activityTransport.id,
      analyticsCodeId: analyticsC.id,
      departureAt: new Date("2026-04-08T07:30:00.000Z"),
      arrivalAt: new Date("2026-04-08T17:15:00.000Z"),
      departureLocationId: locationByCode["LYON-7"].id,
      arrivalLocationId: locationByCode["LYON-7"].id,
      destination: "Déplacement animation Villeurbanne",
      status: ReservationStatus.CONFIRMED,
      createdById: userLyon.id
    }
  });

  await prisma.reservationConflict.create({
    data: {
      reservationId: reservationA.id < reservationB.id ? reservationA.id : reservationB.id,
      conflictingReservationId: reservationA.id < reservationB.id ? reservationB.id : reservationA.id,
      vehicleId: vehicleParis1.id,
      status: ConflictStatus.OPEN,
      reason: "Chevauchement horaire sur le même véhicule."
    }
  });

  await prisma.reservationHistory.createMany({
    data: [
      {
        reservationId: reservationA.id,
        action: "CREATE",
        actorUserId: userParis.id,
        snapshot: { status: ReservationStatus.CONFLICTED }
      },
      {
        reservationId: reservationB.id,
        action: "CREATE",
        actorUserId: approver.id,
        snapshot: { status: ReservationStatus.CONFLICTED }
      },
      {
        reservationId: reservationC.id,
        action: "CREATE",
        actorUserId: userLyon.id,
        snapshot: { status: ReservationStatus.CONFIRMED }
      }
    ]
  });

  const requestA = await prisma.reservationRequest.create({
    data: {
      requesterUserId: pendingUser.id,
      requestedForId: pendingUser.id,
      vehicleId: vehicleParis1.id,
      activityId: activityTraining.id,
      analyticsCodeId: analyticsB.id,
      departureAt: new Date("2026-04-10T09:00:00.000Z"),
      arrivalAt: new Date("2026-04-10T12:00:00.000Z"),
      destination: "Mission découverte",
      status: WorkflowStatus.PENDING,
      notes: "Validation manager nécessaire."
    }
  });

  await prisma.reservationRequest.create({
    data: {
      requesterUserId: userParis.id,
      requestedForId: userParis.id,
      vehicleId: vehicleParis2.id,
      activityId: activityMeetings.id,
      analyticsCodeId: analyticsA.id,
      departureAt: new Date("2026-04-12T08:30:00.000Z"),
      arrivalAt: new Date("2026-04-12T11:00:00.000Z"),
      destination: "Rendez-vous fournisseur",
      status: WorkflowStatus.REJECTED,
      approverId: approver.id,
      rejectionReason: "Véhicule indisponible pour maintenance."
    }
  });

  const [userInfoType, licenseInfoType, vehicleInfoType, insuranceInfoType] = await Promise.all([
    prisma.infoType.create({
      data: {
        entityType: InfoEntityType.USER,
        key: "free-text",
        label: "Information libre",
        valueType: InfoValueType.TEXT,
        defaultVisibility: InfoVisibility.PUBLIC,
        requiresApproval: false
      }
    }),
    prisma.infoType.create({
      data: {
        entityType: InfoEntityType.USER,
        key: "driving-license",
        label: "Permis de conduire",
        valueType: InfoValueType.DOCUMENT,
        defaultVisibility: InfoVisibility.PRIVATE,
        requiresApproval: true
      }
    }),
    prisma.infoType.create({
      data: {
        entityType: InfoEntityType.VEHICLE,
        key: "maintenance-sheet",
        label: "Fiche d'entretien",
        valueType: InfoValueType.DOCUMENT,
        defaultVisibility: InfoVisibility.PRIVATE,
        requiresApproval: true
      }
    }),
    prisma.infoType.create({
      data: {
        entityType: InfoEntityType.VEHICLE,
        key: "insurance",
        label: "Assurance",
        valueType: InfoValueType.DOCUMENT,
        defaultVisibility: InfoVisibility.PRIVATE,
        requiresApproval: true
      }
    })
  ]);

  await prisma.userInfo.createMany({
    data: [
      {
        userId: userParis.id,
        infoTypeId: userInfoType.id,
        label: "Préférence d'usage",
        valueText: "Toujours vérifier la présence du badge parking.",
        visibility: InfoVisibility.PUBLIC,
        status: WorkflowStatus.ACTIVE,
        createdById: userParis.id
      },
      {
        userId: approver.id,
        infoTypeId: licenseInfoType.id,
        label: "Permis B",
        valueText: "Validité jusqu'en 2031",
        visibility: InfoVisibility.PRIVATE,
        status: WorkflowStatus.ACTIVE,
        createdById: admin.id
      }
    ]
  });

  await prisma.userInfoRequest.create({
    data: {
      userId: pendingUser.id,
      infoTypeId: licenseInfoType.id,
      changeType: RequestChangeType.CREATE,
      status: WorkflowStatus.PENDING,
      payload: {
        label: "Permis B",
        valueText: "Document à déposer"
      },
      requestedById: pendingUser.id
    }
  });

  await prisma.vehicleInfo.createMany({
    data: [
      {
        vehicleId: vehicleParis1.id,
        infoTypeId: vehicleInfoType.id,
        label: "Révision 30 000 km",
        valueText: "Réalisée le 05/02/2026",
        visibility: InfoVisibility.PRIVATE,
        status: WorkflowStatus.ACTIVE,
        createdById: admin.id
      },
      {
        vehicleId: vehicleParis1.id,
        infoTypeId: insuranceInfoType.id,
        label: "Contrat MMA",
        valueText: "Échéance 31/12/2026",
        visibility: InfoVisibility.PRIVATE,
        status: WorkflowStatus.ACTIVE,
        createdById: admin.id
      }
    ]
  });

  await prisma.vehicleInfoRequest.create({
    data: {
      vehicleId: vehicleParis2.id,
      infoTypeId: vehicleInfoType.id,
      changeType: RequestChangeType.UPDATE,
      status: WorkflowStatus.PENDING,
      payload: {
        label: "Entretien freins",
        valueText: "Remplacement plaquettes à valider"
      },
      requestedById: approver.id
    }
  });

  await prisma.vehicleComment.createMany({
    data: [
      {
        vehicleId: vehicleParis2.id,
        authorId: approver.id,
        body: "Bruit au freinage signalé, ne pas réserver sans validation atelier.",
        visibility: CommentVisibility.PUBLIC,
        status: WorkflowStatus.ACTIVE
      },
      {
        vehicleId: vehicleLyon1.id,
        authorId: userLyon.id,
        body: "Pneus hiver en bon état, ras.",
        visibility: CommentVisibility.PRIVATE,
        status: WorkflowStatus.ACTIVE
      }
    ]
  });

  await prisma.vehicleCommentRequest.create({
    data: {
      vehicleId: vehicleParis1.id,
      requestedById: userParis.id,
      body: "Ajouter une note sur le support smartphone manquant.",
      visibility: CommentVisibility.PUBLIC,
      status: WorkflowStatus.PENDING
    }
  });

  await prisma.vehicleOdometerLog.createMany({
    data: [
      {
        vehicleId: vehicleParis1.id,
        userId: userParis.id,
        reservationId: reservationA.id,
        type: OdometerEntryType.START,
        valueKm: 32210,
        locationId: locationByCode["PARIS-12"].id,
        occurredAt: new Date("2026-04-07T07:55:00.000Z")
      },
      {
        vehicleId: vehicleParis1.id,
        userId: approver.id,
        reservationId: reservationB.id,
        type: OdometerEntryType.START,
        valueKm: 32214,
        locationId: locationByCode["PARIS-12"].id,
        occurredAt: new Date("2026-04-07T10:20:00.000Z"),
        note: "Lecture réalisée avant arbitrage conflit."
      },
      {
        vehicleId: vehicleLyon1.id,
        userId: userLyon.id,
        reservationId: reservationC.id,
        type: OdometerEntryType.START,
        valueKm: 48210,
        locationId: locationByCode["LYON-7"].id,
        occurredAt: new Date("2026-04-08T07:20:00.000Z")
      },
      {
        vehicleId: vehicleLyon1.id,
        userId: userLyon.id,
        reservationId: reservationC.id,
        type: OdometerEntryType.END,
        valueKm: 48392,
        locationId: locationByCode["LYON-7"].id,
        occurredAt: new Date("2026-04-08T17:20:00.000Z")
      }
    ]
  });

  await prisma.tripLog.create({
    data: {
      reservationId: reservationC.id,
      vehicleId: vehicleLyon1.id,
      userId: userLyon.id,
      departureKm: 48210,
      arrivalKm: 48392,
      departureLocationId: locationByCode["LYON-7"].id,
      arrivalLocationId: locationByCode["LYON-7"].id,
      startedAt: new Date("2026-04-08T07:20:00.000Z"),
      endedAt: new Date("2026-04-08T17:20:00.000Z"),
      comment: "Déplacement complet sans incident."
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: userParis.id,
        type: NotificationType.WARNING,
        title: "Conflit à surveiller",
        body: "Votre réservation du 7 avril est en conflit avec une autre réservation.",
        link: "/conflits"
      },
      {
        userId: approver.id,
        type: NotificationType.INFO,
        title: "Demande en attente",
        body: "Une demande de réservation nécessite votre validation.",
        link: "/demandes"
      },
      {
        userId: pendingUser.id,
        type: NotificationType.INFO,
        title: "Compte en attente d'activation",
        body: "Votre compte est créé, vos droits seront ouverts après validation métier.",
        link: "/informations-personnelles"
      }
    ]
  });

  await prisma.reminderJob.create({
    data: {
      type: "user-info-check",
      targetEntityType: "user",
      targetEntityId: pendingUser.id,
      scheduledAt: new Date("2026-04-15T08:00:00.000Z")
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        targetUserId: admin.id,
        module: "AUTH",
        action: "SEED_LOGIN",
        entityType: "user",
        entityId: admin.id
      },
      {
        actorUserId: approver.id,
        targetUserId: pendingUser.id,
        module: "REQUESTS",
        action: "VIEW_PENDING",
        entityType: "reservation_request",
        entityId: requestA.id
      }
    ]
  });

  console.log("Seed RSVehicule terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
