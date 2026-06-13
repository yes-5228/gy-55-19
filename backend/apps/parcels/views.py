from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Parcel
from .serializers import (
    ParcelInboundSerializer,
    ParcelBulkInboundSerializer,
    ParcelSerializer,
    PickupCodeSerializer,
)
from .services import inbound_parcel, bulk_inbound_parcels, open_by_pickup_code


class ParcelViewSet(viewsets.ModelViewSet):
    queryset = Parcel.objects.select_related("locker_cell").all()
    serializer_class = ParcelSerializer

    @action(detail=False, methods=["post"])
    def inbound(self, request):
        serializer = ParcelInboundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parcel = inbound_parcel(serializer.validated_data)
        return Response(ParcelSerializer(parcel).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def bulk_inbound(self, request):
        serializer = ParcelBulkInboundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = bulk_inbound_parcels(serializer.validated_data["items"])
        serialized_results = []
        for item in result["results"]:
            serialized = {
                "success": item["success"],
                "tracking_no": item["tracking_no"],
                "message": item["message"],
            }
            if item.get("parcel"):
                serialized["parcel"] = ParcelSerializer(item["parcel"]).data
            serialized_results.append(serialized)
        return Response({
            "total": result["total"],
            "success_count": result["success_count"],
            "fail_count": result["fail_count"],
            "results": serialized_results,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def open(self, request):
        serializer = PickupCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parcel = open_by_pickup_code(serializer.validated_data["pickup_code"])
        if not parcel:
            return Response(
                {"success": False, "message": "取件码无效或快件不可取。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "success": True,
                "message": f"柜格 {parcel.locker_cell.code} 已开箱。",
                "parcel": ParcelSerializer(parcel).data,
            }
        )
