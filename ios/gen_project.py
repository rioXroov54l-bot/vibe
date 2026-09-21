#!/usr/bin/env python3
"""Generate Vibe.xcodeproj/project.pbxproj from the files on disk.

This is a small, deterministic generator (classic pbxproj format) so the
Xcode project always matches the Swift sources in ios/Vibe without hand
maintaining UUIDs.
"""
import os
import hashlib

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "Vibe")


def uid(label: str) -> str:
    """Deterministic 24-hex-char identifier from a label."""
    return hashlib.sha1(label.encode()).hexdigest()[:24].upper()


def collect_files():
    swift = []
    resources = []
    for dirpath, dirnames, filenames in os.walk(SRC):
        dirnames[:] = [d for d in dirnames if d != ".DS_Store"]
        # Asset catalogs are directories.
        for d in list(dirnames):
            if d.endswith(".xcassets"):
                rel = os.path.relpath(os.path.join(dirpath, d), ROOT)
                resources.append(rel)
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, ROOT)
            if name.endswith(".swift"):
                swift.append(rel)
    resources = sorted(set(resources))
    return swift, resources


def build_pbxproj():
    swift_files, asset_files = collect_files()
    all_files = swift_files + asset_files

    # Stable object ids.
    root_id = uid("root")
    project_id = uid("project")
    target_id = uid("target")
    main_group_id = uid("main-group")
    products_group_id = uid("products-group")
    sources_phase_id = uid("sources-phase")
    frameworks_phase_id = uid("frameworks-phase")
    resources_phase_id = uid("resources-phase")
    product_ref_id = uid("product-ref")
    proj_cfg_list_id = uid("project-config-list")
    target_cfg_list_id = uid("target-config-list")
    proj_debug_id = uid("project-debug")
    proj_release_id = uid("project-release")
    target_debug_id = uid("target-debug")
    target_release_id = uid("target-release")
    info_plist_id = uid("Info.plist")
    entitlements_id = uid("Vibe.entitlements")
    uitest_target_id = uid("ui-test-target")
    uitest_product_ref_id = uid("ui-test-product-ref")
    uitest_group_id = uid("group-VibeUITests")
    uitest_sources_phase = uid("ui-test-sources")
    uitest_frameworks_phase = uid("ui-test-frameworks")
    uitest_cfg_list = uid("ui-test-config-list")
    uitest_debug = uid("ui-test-debug")
    uitest_release = uid("ui-test-release")
    uitest_dependency = uid("ui-test-dependency")
    uitest_proxy = uid("ui-test-proxy")
    uitest_file = "VibeUITests/VibeUITests.swift"
    uitest_file_ref = uid("fr-" + uitest_file)
    uitest_file_build = uid("bf-" + uitest_file)

    # File references / build files / groups.
    file_refs = {}
    build_files = {}
    group_ids = {}

    # Group hierarchy mirrors directory structure.
    groups = {}
    all_paths = all_files + ["Vibe/Resources/Info.plist", "Vibe/Vibe.entitlements"]
    for rel in all_paths:
        parts = rel.split("/")
        # rel is like "Vibe/App/VibeApp.swift"
        # Build group path as the directory chain.
        for i in range(len(parts) - 1):
            group_path = "/".join(parts[: i + 1])
            if group_path not in group_ids:
                group_ids[group_path] = uid("group-" + group_path)

    lines = []
    a = lines.append
    a("// !$*UTF8*$!")
    a("{")
    a("\tarchiveVersion = 1;")
    a("\tclasses = {")
    a("\t};")
    a("\tobjectVersion = 56;")
    a("\tobjects = {")
    a("")

    # PBXBuildFile
    a("/* Begin PBXBuildFile section */")
    for rel in swift_files:
        fid = uid("bf-" + rel)
        build_files[rel] = fid
        a(f"\t\t{fid} /* {os.path.basename(rel)} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_refs.get(rel, uid('fr-' + rel))} /* {os.path.basename(rel)} */; }};")
    for rel in asset_files:
        fid = uid("bf-" + rel)
        build_files[rel] = fid
        a(f"\t\t{fid} /* {os.path.basename(rel)} in Resources */ = {{isa = PBXBuildFile; fileRef = {file_refs.get(rel, uid('fr-' + rel))} /* {os.path.basename(rel)} */; }};")
    a(f"\t\t{uitest_file_build} /* VibeUITests.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {uitest_file_ref} /* VibeUITests.swift */; }};")
    a("/* End PBXBuildFile section */")
    a("")

    # PBXFileReference
    a("/* Begin PBXFileReference section */")
    for rel in swift_files:
        fid = uid("fr-" + rel)
        file_refs[rel] = fid
        name = os.path.basename(rel)
        a(f"\t\t{fid} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {name}; sourceTree = \"<group>\"; }};")
    for rel in asset_files:
        fid = uid("fr-" + rel)
        file_refs[rel] = fid
        name = os.path.basename(rel)
        a(f"\t\t{fid} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = {name}; sourceTree = \"<group>\"; }};")
    # Info.plist and entitlements references (path relative to SRC root group).
    a(f"\t\t{info_plist_id} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};")
    a(f"\t\t{entitlements_id} /* Vibe.entitlements */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = Vibe.entitlements; sourceTree = \"<group>\"; }};")
    a(f"\t\t{product_ref_id} /* Vibe.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Vibe.app; sourceTree = BUILT_PRODUCTS_DIR; }};")
    a(f"\t\t{uitest_file_ref} /* VibeUITests.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = VibeUITests.swift; sourceTree = \"<group>\"; }};")
    a(f"\t\t{uitest_product_ref_id} /* VibeUITests.xctest */ = {{isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = VibeUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR; }};")
    a("/* End PBXFileReference section */")
    a("")

    # PBXFrameworksBuildPhase
    a("/* Begin PBXFrameworksBuildPhase section */")
    a(f"\t\t{frameworks_phase_id} /* Frameworks */ = {{")
    a("\t\t\tisa = PBXFrameworksBuildPhase;")
    a("\t\t\tbuildActionMask = 2147483647;")
    a("\t\t\tfiles = (")
    a("\t\t\t);")
    a("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
    a("\t\t};")
    a(f"\t\t{uitest_frameworks_phase} /* Frameworks */ = {{")
    a("\t\t\tisa = PBXFrameworksBuildPhase;")
    a("\t\t\tbuildActionMask = 2147483647;")
    a("\t\t\tfiles = (")
    a("\t\t\t);")
    a("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
    a("\t\t};")
    a("/* End PBXFrameworksBuildPhase section */")
    a("")

    # PBXGroup
    a("/* Begin PBXGroup section */")
    # Main group: contains Vibe source folder + Products.
    a(f"\t\t{main_group_id} = {{")
    a("\t\t\tisa = PBXGroup;")
    a("\t\t\tchildren = (")
    a(f"\t\t\t\t{uid('group-Vibe')} /* Vibe */,")
    a(f"\t\t\t\t{uitest_group_id} /* VibeUITests */,")
    a(f"\t\t\t\t{products_group_id} /* Products */,")
    a("\t\t\t);")
    a("\t\t\tsourceTree = \"<group>\";")
    a("\t\t};")
    a(f"\t\t{products_group_id} /* Products */ = {{")
    a("\t\t\tisa = PBXGroup;")
    a("\t\t\tchildren = (")
    a(f"\t\t\t\t{product_ref_id} /* Vibe.app */,")
    a(f"\t\t\t\t{uitest_product_ref_id} /* VibeUITests.xctest */,")
    a("\t\t\t);")
    a("\t\t\tname = Products;")
    a("\t\t\tsourceTree = \"<group>\";")
    a("\t\t};")
    a(f"\t\t{uitest_group_id} /* VibeUITests */ = {{")
    a("\t\t\tisa = PBXGroup;")
    a("\t\t\tchildren = (")
    a(f"\t\t\t\t{uitest_file_ref} /* VibeUITests.swift */,")
    a("\t\t\t);")
    a("\t\t\tpath = VibeUITests;")
    a("\t\t\tsourceTree = \"<group>\";")
    a("\t\t};")

    # Subgroups. The root source group is "Vibe" (path = Vibe).
    # Build a tree of groups by directory.
    tree = {}
    for rel in all_paths:
        parts = rel.split("/")
        node = tree
        for p in parts[:-1]:
            node = node.setdefault(p, {})

    def emit_group(path_parts, path_key):
        # path_key like "Vibe/App"
        gid = group_ids[path_key]
        name = path_parts[-1]
        children = []
        node = tree
        for p in path_parts:
            node = node[p]
        # Direct file children (in this directory).
        direct_files = []
        for rel in all_paths:
            parts = rel.split("/")
            if "/".join(parts[:-1]) == path_key:
                direct_files.append(rel)
        # Subdirectories.
        subdirs = sorted(node.keys())
        for d in subdirs:
            children.append(group_ids[path_key + "/" + d])
        for rel in sorted(direct_files):
            if rel == "Vibe/Resources/Info.plist":
                children.append(info_plist_id)
            elif rel == "Vibe/Vibe.entitlements":
                children.append(entitlements_id)
            else:
                children.append(file_refs[rel])
        a(f"\t\t{gid} /* {name} */ = {{")
        a("\t\t\tisa = PBXGroup;")
        a("\t\t\tchildren = (")
        for c in children:
            a(f"\t\t\t\t{c},")
        a("\t\t\t);")
        a(f"\t\t\tpath = {name};")
        a("\t\t\tsourceTree = \"<group>\";")
        a("\t\t};")

    # Emit groups in order of depth.
    group_paths = sorted(group_ids.keys(), key=lambda p: (p.count("/"), p))
    for gp in group_paths:
        emit_group(gp.split("/"), gp)
    a("/* End PBXGroup section */")
    a("")

    # PBXNativeTarget
    a("/* Begin PBXNativeTarget section */")
    a(f"\t\t{target_id} /* Vibe */ = {{")
    a("\t\t\tisa = PBXNativeTarget;")
    a(f"\t\t\tbuildConfigurationList = {target_cfg_list_id} /* Build configuration list for PBXNativeTarget \"Vibe\" */;")
    a("\t\t\tbuildPhases = (")
    a(f"\t\t\t\t{sources_phase_id} /* Sources */,")
    a(f"\t\t\t\t{frameworks_phase_id} /* Frameworks */,")
    a(f"\t\t\t\t{resources_phase_id} /* Resources */,")
    a("\t\t\t);")
    a("\t\t\tbuildRules = (")
    a("\t\t\t);")
    a("\t\t\tdependencies = (")
    a("\t\t\t);")
    a("\t\t\tname = Vibe;")
    a("\t\t\tproductName = Vibe;")
    a(f"\t\t\tproductReference = {product_ref_id} /* Vibe.app */;")
    a("\t\t\tproductType = \"com.apple.product-type.application\";")
    a("\t\t};")
    a(f"\t\t{uitest_target_id} /* VibeUITests */ = {{")
    a("\t\t\tisa = PBXNativeTarget;")
    a(f"\t\t\tbuildConfigurationList = {uitest_cfg_list} /* Build configuration list for PBXNativeTarget \"VibeUITests\" */;")
    a("\t\t\tbuildPhases = (")
    a(f"\t\t\t\t{uitest_sources_phase} /* Sources */,")
    a(f"\t\t\t\t{uitest_frameworks_phase} /* Frameworks */,")
    a("\t\t\t);")
    a("\t\t\tbuildRules = (")
    a("\t\t\t);")
    a("\t\t\tdependencies = (")
    a(f"\t\t\t\t{uitest_dependency} /* PBXTargetDependency */,")
    a("\t\t\t);")
    a("\t\t\tname = VibeUITests;")
    a("\t\t\tproductName = VibeUITests;")
    a(f"\t\t\tproductReference = {uitest_product_ref_id} /* VibeUITests.xctest */;")
    a("\t\t\tproductType = \"com.apple.product-type.bundle.ui-testing\";")
    a("\t\t};")
    a("/* End PBXNativeTarget section */")
    a("")

    # PBXContainerItemProxy + PBXTargetDependency
    a("/* Begin PBXContainerItemProxy section */")
    a(f"\t\t{uitest_proxy} /* PBXContainerItemProxy */ = {{")
    a("\t\t\tisa = PBXContainerItemProxy;")
    a("\t\t\tcontainerPortal = " + project_id + " /* Project object */;")
    a("\t\t\tproxyType = 1;")
    a("\t\t\tremoteGlobalIDString = " + target_id + ";")
    a("\t\t\tremoteInfo = Vibe;")
    a("\t\t};")
    a("/* End PBXContainerItemProxy section */")
    a("")
    a("/* Begin PBXTargetDependency section */")
    a(f"\t\t{uitest_dependency} /* PBXTargetDependency */ = {{")
    a("\t\t\tisa = PBXTargetDependency;")
    a(f"\t\t\ttarget = {target_id} /* Vibe */;")
    a(f"\t\t\ttargetProxy = {uitest_proxy} /* PBXContainerItemProxy */;")
    a("\t\t};")
    a("/* End PBXTargetDependency section */")
    a("")

    # PBXProject
    a("/* Begin PBXProject section */")
    a(f"\t\t{project_id} /* Project object */ = {{")
    a("\t\t\tisa = PBXProject;")
    a("\t\t\tattributes = {")
    a("\t\t\t\tBuildIndependentTargetsInParallel = 1;")
    a("\t\t\t\tLastSwiftUpdateCheck = 1600;")
    a("\t\t\t\tLastUpgradeCheck = 1600;")
    a("\t\t\t\tTargetAttributes = {")
    a(f"\t\t\t\t\t{target_id} = {{")
    a("\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;")
    a("\t\t\t\t\t};")
    a(f"\t\t\t\t\t{uitest_target_id} = {{")
    a("\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;")
    a(f"\t\t\t\t\t\tTestTargetID = {target_id};")
    a("\t\t\t\t\t};")
    a("\t\t\t\t};")
    a("\t\t\t};")
    a(f"\t\t\tbuildConfigurationList = {proj_cfg_list_id} /* Build configuration list for PBXProject \"Vibe\" */;")
    a("\t\t\tcompatibilityVersion = \"Xcode 14.0\";")
    a("\t\t\tdevelopmentRegion = en;")
    a("\t\t\thasScannedForEncodings = 0;")
    a("\t\t\tknownRegions = (")
    a("\t\t\t\ten,")
    a("\t\t\t\tBase,")
    a("\t\t\t);")
    a(f"\t\t\tmainGroup = {main_group_id};")
    a(f"\t\t\tproductRefGroup = {products_group_id} /* Products */;")
    a("\t\t\tprojectDirPath = \"\";")
    a("\t\t\tprojectRoot = \"\";")
    a("\t\t\ttargets = (")
    a(f"\t\t\t\t{target_id} /* Vibe */,")
    a(f"\t\t\t\t{uitest_target_id} /* VibeUITests */,")
    a("\t\t\t);")
    a("\t\t};")
    a("/* End PBXProject section */")
    a("")

    # PBXResourcesBuildPhase
    a("/* Begin PBXResourcesBuildPhase section */")
    a(f"\t\t{resources_phase_id} /* Resources */ = {{")
    a("\t\t\tisa = PBXResourcesBuildPhase;")
    a("\t\t\tbuildActionMask = 2147483647;")
    a("\t\t\tfiles = (")
    for rel in asset_files:
        a(f"\t\t\t\t{build_files[rel]} /* {os.path.basename(rel)} in Resources */,")
    a("\t\t\t);")
    a("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
    a("\t\t};")
    a("/* End PBXResourcesBuildPhase section */")
    a("")

    # PBXSourcesBuildPhase
    a("/* Begin PBXSourcesBuildPhase section */")
    a(f"\t\t{sources_phase_id} /* Sources */ = {{")
    a("\t\t\tisa = PBXSourcesBuildPhase;")
    a("\t\t\tbuildActionMask = 2147483647;")
    a("\t\t\tfiles = (")
    for rel in swift_files:
        a(f"\t\t\t\t{build_files[rel]} /* {os.path.basename(rel)} in Sources */,")
    a("\t\t\t);")
    a("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
    a("\t\t};")
    a(f"\t\t{uitest_sources_phase} /* Sources */ = {{")
    a("\t\t\tisa = PBXSourcesBuildPhase;")
    a("\t\t\tbuildActionMask = 2147483647;")
    a("\t\t\tfiles = (")
    a(f"\t\t\t\t{uitest_file_build} /* VibeUITests.swift in Sources */,")
    a("\t\t\t);")
    a("\t\t\trunOnlyForDeploymentPostprocessing = 0;")
    a("\t\t};")
    a("/* End PBXSourcesBuildPhase section */")
    a("")

    # Build settings.
    def project_build_settings(deploy):
        return [
            "\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;",
            "\t\t\t\tCLANG_ENABLE_MODULES = YES;",
            "\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;",
            "\t\t\t\tCLANG_ENABLE_OBJC_WEAK = YES;",
            "\t\t\t\tCOPY_PHASE_STRIP = NO;",
            f"\t\t\t\tDEBUG_INFORMATION_FORMAT = {deploy};",
            "\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;",
            "\t\t\t\tENABLE_TESTABILITY = YES;",
            "\t\t\t\tGCC_C_LANGUAGE_STANDARD = gnu11;",
            "\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;",
            "\t\t\t\tGCC_OPTIMIZATION_LEVEL = 0;",
            "\t\t\t\tGCC_PREPROCESSOR_DEFINITIONS = (",
            "\t\t\t\t\t\"DEBUG=1\",",
            "\t\t\t\t\t\"$(inherited)\",",
            "\t\t\t\t);",
            "\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;",
            "\t\t\t\tMTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;",
            "\t\t\t\tMTL_FAST_MATH = YES;",
            "\t\t\t\tONLY_ACTIVE_ARCH = YES;",
            "\t\t\t\tSDKROOT = iphoneos;",
            "\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;",
            "\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = \"-Onone\";",
        ]

    a("/* Begin XCBuildConfiguration section */")
    # Project Debug
    a(f"\t\t{proj_debug_id} /* Debug */ = {{")
    a("\t\t\tisa = XCBuildConfiguration;")
    a("\t\t\tbuildSettings = {")
    for s in project_build_settings("dwarf"):
        a(s)
    a("\t\t\t};")
    a("\t\t\tname = Debug;")
    a("\t\t};")
    # Project Release
    a(f"\t\t{proj_release_id} /* Release */ = {{")
    a("\t\t\tisa = XCBuildConfiguration;")
    a("\t\t\tbuildSettings = {")
    for s in [
        "\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;",
        "\t\t\t\tCLANG_ENABLE_MODULES = YES;",
        "\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;",
        "\t\t\t\tCLANG_ENABLE_OBJC_WEAK = YES;",
        "\t\t\t\tCOPY_PHASE_STRIP = NO;",
        "\t\t\t\tDEBUG_INFORMATION_FORMAT = \"dwarf-with-dsym\";",
        "\t\t\t\tENABLE_NS_ASSERTIONS = NO;",
        "\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;",
        "\t\t\t\tGCC_C_LANGUAGE_STANDARD = gnu11;",
        "\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;",
        "\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;",
        "\t\t\t\tMTL_ENABLE_DEBUG_INFO = NO;",
        "\t\t\t\tMTL_FAST_MATH = YES;",
        "\t\t\t\tSDKROOT = iphoneos;",
        "\t\t\t\tSWIFT_COMPILATION_MODE = wholemodule;",
        "\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = \"-O\";",
        "\t\t\t\tVALIDATE_PRODUCT = YES;",
    ]:
        a(s)
    a("\t\t\t};")
    a("\t\t\tname = Release;")
    a("\t\t};")

    # Target build settings (shared).
    target_settings = [
        "\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;",
        "\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;",
        "\t\t\t\tCODE_SIGN_STYLE = Automatic;",
        f"\t\t\t\tCODE_SIGN_ENTITLEMENTS = Vibe/Vibe.entitlements;",
        "\t\t\t\tCURRENT_PROJECT_VERSION = 1;",
        "\t\t\t\tGENERATE_INFOPLIST_FILE = NO;",
        "\t\t\t\tINFOPLIST_FILE = Vibe/Resources/Info.plist;",
        "\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;",
        "\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (",
        "\t\t\t\t\t\"$(inherited)\",",
        "\t\t\t\t\t\"@executable_path/Frameworks\",",
        "\t\t\t\t);",
        "\t\t\t\tMARKETING_VERSION = 1.0;",
        "\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.vibe.social;",
        "\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";",
        "\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;",
        "\t\t\t\tSWIFT_VERSION = 5.0;",
        "\t\t\t\tTARGETED_DEVICE_FAMILY = 1;",
    ]

    for cfg_id, cfg_name, extra in [
        (target_debug_id, "Debug", "\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;"),
        (target_release_id, "Release", ""),
    ]:
        a(f"\t\t{cfg_id} /* {cfg_name} */ = {{")
        a("\t\t\tisa = XCBuildConfiguration;")
        a("\t\t\tbuildSettings = {")
        for s in target_settings:
            a(s)
        if extra:
            a(extra)
        a("\t\t\t};")
        a(f"\t\t\tname = {cfg_name};")
        a("\t\t};")
    uitest_settings = [
        "\t\t\t\tCODE_SIGN_STYLE = Automatic;",
        "\t\t\t\tCURRENT_PROJECT_VERSION = 1;",
        "\t\t\t\tGENERATE_INFOPLIST_FILE = YES;",
        "\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;",
        "\t\t\t\tMARKETING_VERSION = 1.0;",
        "\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.vibe.social.uitests;",
        "\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";",
        "\t\t\t\tSWIFT_VERSION = 5.0;",
        "\t\t\t\tTARGETED_DEVICE_FAMILY = 1;",
        f"\t\t\t\tTEST_TARGET_NAME = Vibe;",
    ]
    for cfg_id, cfg_name, extra in [
        (uitest_debug, "Debug", ""),
        (uitest_release, "Release", ""),
    ]:
        a(f"\t\t{cfg_id} /* {cfg_name} */ = {{")
        a("\t\t\tisa = XCBuildConfiguration;")
        a("\t\t\tbuildSettings = {")
        for s in uitest_settings:
            a(s)
        if extra:
            a(extra)
        a("\t\t\t};")
        a(f"\t\t\tname = {cfg_name};")
        a("\t\t};")
    a("/* End XCBuildConfiguration section */")
    a("")

    # XCConfigurationList
    a("/* Begin XCConfigurationList section */")
    a(f"\t\t{proj_cfg_list_id} /* Build configuration list for PBXProject \"Vibe\" */ = {{")
    a("\t\t\tisa = XCConfigurationList;")
    a("\t\t\tbuildConfigurations = (")
    a(f"\t\t\t\t{proj_debug_id} /* Debug */,")
    a(f"\t\t\t\t{proj_release_id} /* Release */,")
    a("\t\t\t);")
    a("\t\t\tdefaultConfigurationIsVisible = 0;")
    a("\t\t\tdefaultConfigurationName = Release;")
    a("\t\t};")
    a(f"\t\t{target_cfg_list_id} /* Build configuration list for PBXNativeTarget \"Vibe\" */ = {{")
    a("\t\t\tisa = XCConfigurationList;")
    a("\t\t\tbuildConfigurations = (")
    a(f"\t\t\t\t{target_debug_id} /* Debug */,")
    a(f"\t\t\t\t{target_release_id} /* Release */,")
    a("\t\t\t);")
    a("\t\t\tdefaultConfigurationIsVisible = 0;")
    a("\t\t\tdefaultConfigurationName = Release;")
    a("\t\t};")
    a(f"\t\t{uitest_cfg_list} /* Build configuration list for PBXNativeTarget \"VibeUITests\" */ = {{")
    a("\t\t\tisa = XCConfigurationList;")
    a("\t\t\tbuildConfigurations = (")
    a(f"\t\t\t\t{uitest_debug} /* Debug */,")
    a(f"\t\t\t\t{uitest_release} /* Release */,")
    a("\t\t\t);")
    a("\t\t\tdefaultConfigurationIsVisible = 0;")
    a("\t\t\tdefaultConfigurationName = Release;")
    a("\t\t};")
    a("/* End XCConfigurationList section */")
    a("\t};")
    a(f"\trootObject = {project_id} /* Project object */;")
    a("}")

    return "\n".join(lines) + "\n"


def main():
    out_dir = os.path.join(ROOT, "Vibe.xcodeproj")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "project.pbxproj")
    with open(out, "w") as f:
        f.write(build_pbxproj())
    print(f"Wrote {out}")

    scheme_dir = os.path.join(out_dir, "xcshareddata", "xcschemes")
    os.makedirs(scheme_dir, exist_ok=True)
    scheme = os.path.join(scheme_dir, "Vibe.xcscheme")
    target_id = uid("target")
    uitest_target_id = uid("ui-test-target")
    scheme_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.7">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES">
    <BuildActionEntries>
      <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">
        <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target_id}" BuildableName="Vibe.app" BlueprintName="Vibe" ReferencedContainer="container:Vibe.xcodeproj"/>
      </BuildActionEntry>
    </BuildActionEntries>
  </BuildAction>
  <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES">
    <Testables>
      <TestableReference skipped="NO">
        <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{uitest_target_id}" BuildableName="VibeUITests.xctest" BlueprintName="VibeUITests" ReferencedContainer="container:Vibe.xcodeproj"/>
      </TestableReference>
    </Testables>
  </TestAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">
      <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target_id}" BuildableName="Vibe.app" BlueprintName="Vibe" ReferencedContainer="container:Vibe.xcodeproj"/>
    </BuildableProductRunnable>
  </LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">
      <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target_id}" BuildableName="Vibe.app" BlueprintName="Vibe" ReferencedContainer="container:Vibe.xcodeproj"/>
    </BuildableProductRunnable>
  </ProfileAction>
  <AnalyzeAction buildConfiguration="Debug">
  </AnalyzeAction>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES">
  </ArchiveAction>
</Scheme>
'''
    with open(scheme, "w") as f:
        f.write(scheme_xml)
    print(f"Wrote {scheme}")


if __name__ == "__main__":
    main()
