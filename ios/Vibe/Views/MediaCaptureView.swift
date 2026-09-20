import SwiftUI
import PhotosUI

struct MediaCaptureView: View {
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedImages: [Data] = []

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            VStack(spacing: 20) {
                PhotosPicker(selection: $selectedItems, maxSelectionCount: 6, matching: .images) {
                    Label("Choose photos", systemImage: "photo.on.rectangle")
                }
                .onChange(of: selectedItems) { _, items in
                    Task {
                        selectedImages = []
                        for item in items {
                            if let data = try? await item.loadTransferable(type: Data.self) {
                                selectedImages.append(data)
                            }
                        }
                    }
                }

                ScrollView(.horizontal) {
                    HStack {
                        ForEach(selectedImages.indices, id: \.self) { index in
                            if let image = UIImage(data: selectedImages[index]) {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 110, height: 145)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                            }
                        }
                    }
                    .padding()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .padding()
    }
}
