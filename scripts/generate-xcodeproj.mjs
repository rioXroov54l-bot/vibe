import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('ios');
const sourceRoot = path.join(root, 'Vibe');
const files = [];

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(full);
  }
}

await walk(sourceRoot);

const swiftFiles = files.filter(f => f.endsWith('.swift')).sort();
const assetCatalog = path.join(sourceRoot, 'Assets.xcassets');
const resourceFiles = files
  .filter(f => !f.endsWith('.swift'))
  .filter(f => !f.endsWith('Info.plist'))
  .filter(f => !f.endsWith('.entitlements'))
  .filter(f => !f.includes(`${path.sep}Assets.xcassets${path.sep}`))
  .sort();
resourceFiles.push(assetCatalog);

let counter = 0;
const uuid = prefix => {
  counter += 1;
  const hex = counter.toString(16).padStart(24, '0').toUpperCase();
  return `${prefix}${hex}`;
};

const ids = {
  project: uuid('AB'),
  target: uuid('AC'),
  mainGroup: uuid('AD'),
  productsGroup: uuid('AE'),
  sourcesPhase: uuid('AF'),
  resourcesPhase: uuid('B0'),
  frameworksPhase: uuid('B1'),
  buildConfigList: uuid('B2'),
  targetConfigList: uuid('B3'),
  projectDebug: uuid('B4'),
  projectRelease: uuid('B5'),
  targetDebug: uuid('B6'),
  targetRelease: uuid('B7'),
  sourceRootGroup: uuid('B8'),
  productRef: uuid('B9')
};

const swiftRefs = new Map();
const swiftBuildFiles = [];
for (const file of swiftFiles) {
  const ref = uuid('C0');
  const build = uuid('C1');
  swiftRefs.set(file, ref);
  swiftBuildFiles.push(build);
}

const resourceRefs = new Map();
const resourceBuildFiles = [];
for (const file of resourceFiles) {
  const ref = uuid('D0');
  const build = uuid('D1');
  resourceRefs.set(file, ref);
  resourceBuildFiles.push(build);
}

const quote = s => `"${s}"`;
const pathString = s => quote(s);

function fileReference(id, fullPath, lastKnownType) {
  const name = path.basename(fullPath);
  return `${id} /* ${name} */ = {isa = PBXFileReference; lastKnownFileType = ${lastKnownType}; name = ${quote(name)}; path = ${quote(path.relative(sourceRoot, fullPath))}; sourceTree = "<group>"; };`;
}

const swiftFileRefs = [...swiftRefs.entries()]
  .map(([file, id]) => fileReference(id, file, 'sourcecode.swift'))
  .join('\n');

const resourceFileRefs = [...resourceRefs.entries()]
  .map(([file, id]) => {
    if (file.endsWith('.xcprivacy') || file.endsWith('.plist')) {
      return fileReference(id, file, 'text.plist.xml');
    }
  if (file.endsWith('.entitlements')) return fileReference(id, file, 'text.plist.entitlements');
  if (file.endsWith('.json')) return fileReference(id, file, 'text.json');
  if (file.endsWith('.xcassets')) return fileReference(id, file, 'folder.assetcatalog');
  return fileReference(id, file, 'file');
  })
  .join('\n');

const swiftBuildFilesSection = swiftBuildFiles
  .map((id, index) => `${id} /* ${path.basename([...swiftRefs.keys()][index])} in Sources */ = {isa = PBXBuildFile; fileRef = ${[...swiftRefs.values()][index]} /* ${path.basename([...swiftRefs.keys()][index])} */; };`)
  .join('\n');

const resourceBuildFilesSection = resourceBuildFiles
  .map((id, index) => `${id} /* ${path.basename([...resourceRefs.keys()][index])} in Resources */ = {isa = PBXBuildFile; fileRef = ${[...resourceRefs.values()][index]} /* ${path.basename([...resourceRefs.keys()][index])} */; };`)
  .join('\n');

const pbxproj = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXBuildFile section */
${swiftBuildFilesSection}
${resourceBuildFilesSection}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
${ids.productRef} /* Vibe.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Vibe.app; sourceTree = BUILT_PRODUCTS_DIR; };
${swiftFileRefs}
${resourceFileRefs}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
${ids.frameworksPhase} /* Frameworks */ = {
	isa = PBXFrameworksBuildPhase;
	buildActionMask = 2147483647;
	files = (
	);
	runOnlyForDeploymentPostprocessing = 0;
};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
${ids.mainGroup} = {
	isa = PBXGroup;
	children = (
		${ids.sourceRootGroup} /* Vibe */,
		${ids.productsGroup} /* Products */,
	);
	sourceTree = "<group>";
};
${ids.productsGroup} /* Products */ = {
	isa = PBXGroup;
	children = (
		${ids.productRef} /* Vibe.app */,
	);
	name = Products;
	sourceTree = "<group>";
};
${ids.sourceRootGroup} /* Vibe */ = {
	isa = PBXGroup;
	children = (
		${[...swiftRefs.values(), ...resourceRefs.values()].join(',\n\t\t')}
	);
	path = Vibe;
	sourceTree = "<group>";
};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
${ids.target} /* Vibe */ = {
	isa = PBXNativeTarget;
	buildConfigurationList = ${ids.targetConfigList} /* Build configuration list for PBXNativeTarget "Vibe" */;
	buildPhases = (
		${ids.sourcesPhase} /* Sources */,
		${ids.frameworksPhase} /* Frameworks */,
		${ids.resourcesPhase} /* Resources */,
	);
	buildRules = (
	);
	dependencies = (
	);
	name = Vibe;
	productName = Vibe;
	productReference = ${ids.productRef} /* Vibe.app */;
	productType = "com.apple.product-type.application";
};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
${ids.project} /* Project object */ = {
	isa = PBXProject;
	attributes = {
		BuildIndependentTargetsInParallel = 1;
		LastSwiftUpdateCheck = 2600;
		LastUpgradeCheck = 2600;
		TargetAttributes = {
			${ids.target} = {
				CreatedOnToolsVersion = 26.0;
			};
		};
	};
	buildConfigurationList = ${ids.buildConfigList} /* Build configuration list for PBXProject "Vibe" */;
	compatibilityVersion = "Xcode 14.0";
	developmentRegion = en;
	hasScannedForEncodings = 0;
	knownRegions = (
		en,
		Base,
	);
	mainGroup = ${ids.mainGroup};
	productRefGroup = ${ids.productsGroup} /* Products */;
	projectDirPath = "";
	projectRoot = "";
	targets = (
		${ids.target} /* Vibe */,
	);
};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
${ids.resourcesPhase} /* Resources */ = {
	isa = PBXResourcesBuildPhase;
	buildActionMask = 2147483647;
	files = (
		${resourceBuildFiles.join(',\n\t\t')}
	);
	runOnlyForDeploymentPostprocessing = 0;
};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
${ids.sourcesPhase} /* Sources */ = {
	isa = PBXSourcesBuildPhase;
	buildActionMask = 2147483647;
	files = (
		${swiftBuildFiles.join(',\n\t\t')}
	);
	runOnlyForDeploymentPostprocessing = 0;
};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
${ids.projectDebug} /* Debug */ = {
	isa = XCBuildConfiguration;
	buildSettings = {
		ALWAYS_SEARCH_USER_PATHS = NO;
		CLANG_ENABLE_MODULES = YES;
		CLANG_ENABLE_OBJC_ARC = YES;
		COPY_PHASE_STRIP = NO;
		DEBUG_INFORMATION_FORMAT = dwarf;
		ENABLE_STRICT_OBJC_MSGSEND = YES;
		ENABLE_TESTABILITY = YES;
		GCC_C_LANGUAGE_STANDARD = gnu17;
		IPHONEOS_DEPLOYMENT_TARGET = 17.0;
		MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
		ONLY_ACTIVE_ARCH = YES;
		SDKROOT = iphoneos;
		SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
		SWIFT_OPTIMIZATION_LEVEL = "-Onone";
	};
	name = Debug;
};
${ids.projectRelease} /* Release */ = {
	isa = XCBuildConfiguration;
	buildSettings = {
		ALWAYS_SEARCH_USER_PATHS = NO;
		CLANG_ENABLE_MODULES = YES;
		CLANG_ENABLE_OBJC_ARC = YES;
		COPY_PHASE_STRIP = NO;
		DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
		ENABLE_NS_ASSERTIONS = NO;
		ENABLE_STRICT_OBJC_MSGSEND = YES;
		GCC_C_LANGUAGE_STANDARD = gnu17;
		IPHONEOS_DEPLOYMENT_TARGET = 17.0;
		MTL_ENABLE_DEBUG_INFO = NO;
		SDKROOT = iphoneos;
		SWIFT_COMPILATION_MODE = wholemodule;
		SWIFT_OPTIMIZATION_LEVEL = "-O";
		VALIDATE_PRODUCT = YES;
	};
	name = Release;
};
${ids.targetDebug} /* Debug */ = {
	isa = XCBuildConfiguration;
	buildSettings = {
		ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
		CODE_SIGN_STYLE = Automatic;
		GENERATE_INFOPLIST_FILE = NO;
		INFOPLIST_FILE = Vibe/Info.plist;
		MARKETING_VERSION = 1.0;
		CURRENT_PROJECT_VERSION = 1;
		PRODUCT_BUNDLE_IDENTIFIER = com.vibe.app;
		PRODUCT_NAME = "$(TARGET_NAME)";
		SWIFT_EMIT_LOC_STRINGS = YES;
		SWIFT_VERSION = 5.0;
		TARGETED_DEVICE_FAMILY = 1;
		VIBE_API_URL = "https://vibe-social-nights.bb0949.chatgpt.site";
		VIBE_SUPABASE_URL = "https://hsvcdyxelshvgofjvlim.supabase.co";
		VIBE_SUPABASE_ANON_KEY = "sb_publishable_BCp7IhSHgWkNqXFY0Tk1xA_SE3wIWTg";
	};
	name = Debug;
};
${ids.targetRelease} /* Release */ = {
	isa = XCBuildConfiguration;
	buildSettings = {
		ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
		CODE_SIGN_STYLE = Automatic;
		GENERATE_INFOPLIST_FILE = NO;
		INFOPLIST_FILE = Vibe/Info.plist;
		MARKETING_VERSION = 1.0;
		CURRENT_PROJECT_VERSION = 1;
		PRODUCT_BUNDLE_IDENTIFIER = com.vibe.app;
		PRODUCT_NAME = "$(TARGET_NAME)";
		SWIFT_EMIT_LOC_STRINGS = YES;
		SWIFT_VERSION = 5.0;
		TARGETED_DEVICE_FAMILY = 1;
		VIBE_API_URL = "https://vibe-social-nights.bb0949.chatgpt.site";
		VIBE_SUPABASE_URL = "https://hsvcdyxelshvgofjvlim.supabase.co";
		VIBE_SUPABASE_ANON_KEY = "sb_publishable_BCp7IhSHgWkNqXFY0Tk1xA_SE3wIWTg";
	};
	name = Release;
};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
${ids.buildConfigList} /* Build configuration list for PBXProject "Vibe" */ = {
	isa = XCConfigurationList;
	buildConfigurations = (
		${ids.projectDebug} /* Debug */,
		${ids.projectRelease} /* Release */,
	);
	defaultConfigurationIsVisible = 0;
	defaultConfigurationName = Release;
};
${ids.targetConfigList} /* Build configuration list for PBXNativeTarget "Vibe" */ = {
	isa = XCConfigurationList;
	buildConfigurations = (
		${ids.targetDebug} /* Debug */,
		${ids.targetRelease} /* Release */,
	);
	defaultConfigurationIsVisible = 0;
	defaultConfigurationName = Release;
};
/* End XCConfigurationList section */
	};
	rootObject = ${ids.project} /* Project object */;
}
`;

await fs.mkdir(path.join(root, 'Vibe.xcodeproj'), { recursive: true });
await fs.writeFile(path.join(root, 'Vibe.xcodeproj', 'project.pbxproj'), pbxproj, 'utf8');
console.log('Generated ios/Vibe.xcodeproj/project.pbxproj');
