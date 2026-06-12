# Library Versions
WEBP_VERSION=1.6.0
LIBDE265_VERSION=1.0.18
LIBAOM_VERSION=3.14.1
X265_VERSION=4.1
LIBHEIF_VERSION=1.23.0
VIPS_VERSION=8.18.3
SHARP_VERSION=0.35.1

# CodeBuild medium instances can OOM when libaom compiles with full parallelism.
BUILD_JOBS ?= 2
LIBAOM_BUILD_JOBS ?= 1

PREFIX_PATH=/usr/local
LIB_PATH=$(PREFIX_PATH)/lib
LIBRARY_PATH=$(LIB_PATH)
# EXAMPLE_IMAGE_PATH=$(CURDIR)/example-images

export PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig:$$PKG_CONFIG_PATH
export LD_LIBRARY_PATH=$(LIB_PATH):$$LD_LIBRARY_PATH

CURL=curl --fail --location --silent --show-error
ARTIFACTS_NODEJS_DIR=$(ARTIFACTS_DIR)/nodejs
ARTIFACTS_LIB_DIR=$(ARTIFACTS_DIR)/lib
.PHONY: build-SharpHEICLayer clean installLib system-libs verifySystemLibs codec-stack verifyCodecStack verifyLibvips libwebp libde265 x265 libaom libheif libvips

build-SharpHEICLayer: libvips
	@printf '\n==> %s\n' "Preparing layer artifacts"
	test -n "$(ARTIFACTS_DIR)"
	mkdir -p "$(ARTIFACTS_NODEJS_DIR)" "$(ARTIFACTS_LIB_DIR)"

	@printf '\n==> %s\n' "Using dependency versions"
	printf '  sharp=%s\n  libvips=%s\n  libheif=%s\n  libwebp=%s\n  libde265=%s\n  x265=%s\n  libaom=%s\n' "$(SHARP_VERSION)" "$(VIPS_VERSION)" "$(LIBHEIF_VERSION)" "$(WEBP_VERSION)" "$(LIBDE265_VERSION)" "$(X265_VERSION)" "$(LIBAOM_VERSION)"

	@printf '\n==> %s\n' "Installing sharp build prerequisites"
	npm install --save --prefix "$(ARTIFACTS_NODEJS_DIR)/" node-addon-api node-gyp

	@printf '\n==> %s\n' "Checking libvips version"
	pkg-config --modversion vips-cpp

	@printf '\n==> %s\n' "Installing sharp $(SHARP_VERSION)"
	npm install --save --prefix "$(ARTIFACTS_NODEJS_DIR)/" --verbose sharp@$(SHARP_VERSION)

	@printf '\n==> %s\n' "Building sharp $(SHARP_VERSION) from source"
	SHARP_FORCE_GLOBAL_LIBVIPS=1 npm --prefix "$(ARTIFACTS_NODEJS_DIR)/node_modules/sharp" --loglevel verbose run build

	@printf '\n==> %s\n' "Collecting shared library dependencies"
	SHARP_BINARY="$$(node -e 'const fs = require("fs"); const path = require("path"); const root = process.argv[1]; const pattern = /(^|\/)Release\/sharp[^/]*\.node$$/; const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) { const found = walk(full); if (found) return found; } else if (pattern.test(full)) { return full; } } return ""; }; const result = walk(root); if (result) process.stdout.write(result);' "$(ARTIFACTS_NODEJS_DIR)/node_modules/sharp")"; \
	test -n "$$SHARP_BINARY" || { echo "Unable to locate compiled sharp addon"; exit 1; }; \
	test -f "$$SHARP_BINARY"; \
	ldd "$$SHARP_BINARY"; \
	ldd "$$SHARP_BINARY" | awk '/\// { print $$3 }' | sort -u | tee /tmp/sharp-layer-libs.txt; \
	while IFS= read -r lib; do cp "$$lib" "$(ARTIFACTS_LIB_DIR)"; done < /tmp/sharp-layer-libs.txt; \
	printf '\n==> %s\n' "Layer artifact summary"; \
	printf '  sharp binary: %s\n' "$$SHARP_BINARY"; \
	printf '  copied shared libraries:\n'; \
	ls -la "$(ARTIFACTS_LIB_DIR)"

system-libs: installLib verifySystemLibs

verifySystemLibs:
	@printf '\n==> %s\n' "Verifying native build prerequisites"
	pkg-config --version

libwebp:
	@printf '\n==> %s\n' "Building libwebp $(WEBP_VERSION)"
	rm -rf "libwebp-$(WEBP_VERSION)"
	$(CURL) "https://github.com/webmproject/libwebp/archive/v$(WEBP_VERSION).tar.gz" | tar zx
	cd libwebp-$(WEBP_VERSION) && ./autogen.sh && ./configure --enable-libwebpmux --prefix=$(PREFIX_PATH) && make V=0 -j$(BUILD_JOBS) && make install

codec-stack: libheif verifyCodecStack

verifyCodecStack:
	@printf '\n==> %s\n' "Verifying custom HEIF codec stack"
	pkg-config --modversion libde265
	pkg-config --modversion x265
	pkg-config --modversion aom
	pkg-config --modversion libheif

libde265:
	@printf '\n==> %s\n' "Building libde265 $(LIBDE265_VERSION)"
	rm -rf "libde265-$(LIBDE265_VERSION)"
	$(CURL) "https://github.com/strukturag/libde265/releases/download/v$(LIBDE265_VERSION)/libde265-$(LIBDE265_VERSION).tar.gz" | tar zx
	cd libde265-$(LIBDE265_VERSION) && cmake -S . -B build \
		-DCMAKE_INSTALL_PREFIX=$(PREFIX_PATH) \
		-DCMAKE_INSTALL_LIBDIR=$(LIB_PATH) \
		-DBUILD_SHARED_LIBS=ON \
		-DENABLE_DECODER=OFF \
		-DENABLE_SHERLOCK265=OFF && \
		cmake --build build --parallel $(BUILD_JOBS) && \
		cmake --install build

x265:
	@printf '\n==> %s\n' "Building x265 $(X265_VERSION)"
	rm -rf "x265_$(X265_VERSION)"
	$(CURL) "https://bitbucket.org/multicoreware/x265_git/downloads/x265_$(X265_VERSION).tar.gz" | tar zx
	cd x265_$(X265_VERSION) && cd build/linux && cmake -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$(PREFIX_PATH) ../../source && make V=0 -j$(BUILD_JOBS) && make install

libaom:
	@printf '\n==> %s\n' "Building libaom $(LIBAOM_VERSION)"
	rm -rf "libaom-$(LIBAOM_VERSION)"
	$(CURL) "https://storage.googleapis.com/aom-releases/libaom-$(LIBAOM_VERSION).tar.gz" | tar zx
	cd libaom-${LIBAOM_VERSION} && cmake -S . -B build \
		-DCONFIG_AV1_ENCODER=1 \
		-DBUILD_SHARED_LIBS=1 \
		-DENABLE_TESTS=0 \
		-DENABLE_DOCS=0 \
		-DENABLE_EXAMPLES=0 \
		-DENABLE_TOOLS=0 \
		-DCMAKE_INSTALL_PREFIX=${PREFIX_PATH} \
		-DCMAKE_INSTALL_LIBDIR=${PREFIX_PATH}/lib && \
		cmake --build build --parallel $(LIBAOM_BUILD_JOBS) && \
		cmake --install build

libheif: x265 libde265 libaom
	@printf '\n==> %s\n' "Building libheif $(LIBHEIF_VERSION)"
	rm -rf "libheif-$(LIBHEIF_VERSION)"
	$(CURL) "https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz" | tar zx
	cd libheif-$(LIBHEIF_VERSION) && mkdir -p build && cd build && cmake -DCMAKE_INSTALL_LIBDIR=$(LIB_PATH) -DWITH_EXAMPLES=OFF --preset=release-noplugins .. && make V=0 -j$(BUILD_JOBS) && make install

libvips: system-libs codec-stack libwebp
	@printf '\n==> %s\n' "Building libvips $(VIPS_VERSION)"
	rm -rf "vips-$(VIPS_VERSION)"
	$(CURL) "https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.xz" | tar xJ
	cd vips-$(VIPS_VERSION) && meson setup build --prefix ${PREFIX_PATH} --libdir ${LIB_PATH} -Dheif=enabled -Dheif-module=disabled -Dlcms=enabled --buildtype release && meson compile -C build -j $(BUILD_JOBS) && meson install -C build
	$(MAKE) verifyLibvips

verifyLibvips:
	@printf '\n==> %s\n' "Verifying libvips build"
	pkg-config --modversion vips-cpp
	"$(PREFIX_PATH)/bin/vips" -l | awk '/Heif/ { found = 1 } END { exit(found ? 0 : 1) }'

# libheif: libde265
# 	# libheif
# 	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
# 	cd libheif-$(LIBHEIF_VERSION) && ./autogen.sh && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install
# 	cd libheif-$(LIBHEIF_VERSION)/examples && ./heif-convert example.heic example.jpeg && cp example*.jpeg $(EXAMPLE_IMAGE_PATH) && cp example.heic $(EXAMPLE_IMAGE_PATH)

# libvips: installLib libheif libwebp
# 	# libvips
# 	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.gz | tar zx
# 	cd vips-$(VIPS_VERSION) && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install
# 	cd vips-$(VIPS_VERSION)/tools && ./vips rot $(EXAMPLE_IMAGE_PATH)/example.heic $(EXAMPLE_IMAGE_PATH)/example-rot.jpeg d90

installLib:
	@printf '\n==> %s\n' "Installing native build dependencies"
	dnf groupinstall -y "Development Tools" && \
	dnf install -y \
		glib2-devel \
		expat-devel \
		libjpeg-turbo-devel \
		libpng-devel \
		giflib-devel \
		libexif-devel \
		librsvg2-devel \
		libtiff-devel \
		lcms2-devel \
		gobject-introspection-devel \
		cmake \
		nasm \
		pkg-config \
		meson \
		ninja-build

clean:
	@printf '\n==> %s\n' "Removing downloaded source directories"
	rm -rf \
		"libwebp-$(WEBP_VERSION)" \
		"libde265-$(LIBDE265_VERSION)" \
		"x265_$(X265_VERSION)" \
		"libaom-$(LIBAOM_VERSION)" \
		"libheif-$(LIBHEIF_VERSION)" \
		"vips-$(VIPS_VERSION)"
	if [ -n "$(ARTIFACTS_DIR)" ]; then rm -rf "$(ARTIFACTS_DIR)/nodejs" "$(ARTIFACTS_DIR)/lib"; fi

